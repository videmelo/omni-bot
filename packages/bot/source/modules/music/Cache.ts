/*
 * This saves the data of the songs the bot has already played
 * in a text channel you choose — like on a dev server, for example —
 * so it doesn’t have to download them from YouTube again.
 *
 * If you’re planning to run the bot in production, pick a private channel
 * where only the bot can access.
 *
 * Soon I’ll drop a link to a public channel where multiple bots
 * can share their played songs data.
 *
 * If you’re reading this, yeah… we’re not there yet.
 */

import fs from 'node:fs/promises';
import Stream from 'stream';
import { Track } from './models/Track.js';
import type { TrackData } from '@omni/shared';
import { AttachmentBuilder, TextChannel } from 'discord.js';

import Bot from '../../core/Bot.js';
import logger from '../../utils/logger.js';

interface CachedTrack {
  id: string; // source id
  encoded: string; // encoded track
  key: string; // encoded query
  message: string; // message id
  stream: string; // youtube id
}

export class Cache {
  private client: Bot;
  private channel: string;
  private static fileLock: Promise<void> = Promise.resolve();

  constructor(client: Bot) {
    this.client = client;
    this.channel = client.config.cache;
  }

  private static async withFileLock<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const lock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = Cache.fileLock;
    Cache.fileLock = lock;
    await previous;
    try {
      return await fn();
    } finally {
      release!();
    }
  }

  async archive(track: Track, stream: Stream.PassThrough, chunks: Buffer[]) {
    if (!stream) return;

    const channel = await this.client.channels
      .fetch(this.channel)
      .catch(() => logger.error('Cache: Invalid Text Channel ID'));

    if (!channel) throw new Error('Text Channel not found!');
    if (!channel.isSendable()) return;

    try {
      await new Promise((resolve, reject) => {
        stream.once('end', resolve);
        stream.once('error', reject);
      });
    } catch (error) {
      logger.error('Cache: Aborting archive due to stream error:', error);
      return;
    }

    const buffered = Buffer.concat(chunks);
    const attachment = new AttachmentBuilder(buffered, { name: `${track.id}.opus` });

    const message = await channel.send({
      content: `${track.name} - ${track.artist.name}`,
      files: [attachment],
    });

    const encoded = Buffer.from(JSON.stringify({ ...track })).toString('base64');

    await Cache.withFileLock(async () => {
      try {
        const file = 'tracks.json';
        const existing = await fs
          .stat(file)
          .then(() => true)
          .catch(() => false);
        const json: CachedTrack[] = existing
          ? (JSON.parse(await fs.readFile(file, 'utf8')) as CachedTrack[])
          : [];

        json.push({
          id: track.id,
          key: track.key!,
          encoded: encoded,
          message: message.id,
          stream: track.metadata!.id,
        });

        await fs.writeFile(file, JSON.stringify(json, null, 2), 'utf8');
      } catch (error: unknown) {
        logger.error('Error to save cache:', error);
      }
    });
  }

  async getTrackData(track: Track): Promise<Track | undefined> {
    try {
      const data = await fs.readFile('tracks.json', 'utf8');
      const tracks: CachedTrack[] = JSON.parse(data) as CachedTrack[];
      const cached = tracks.find(
        (item) =>
          item.id === track.id || item.key === track.key || item.stream === track.metadata?.id,
      );
      if (!cached) return;

      const channel = (await this.client.channels.fetch(this.channel)) as TextChannel;
      if (!channel) return;

      const message = await channel.messages.fetch(cached.message);
      const url = message.attachments.first()?.url;
      if (!url) return;

      const decoded = JSON.parse(
        Buffer.from(cached.encoded, 'base64').toString('utf8'),
      ) as unknown as TrackData;
      return new Track({
        ...decoded,
        cached: true,
        streamable: url,
      });
    } catch {
      return undefined;
    }
  }

  async getAudioStream(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok || !response.body) throw new Error('Error to fetch audio');

      const reader = response.body.getReader();
      return new Stream.Readable({
        async read() {
          try {
            const { done, value } = (await reader.read()) as {
              done: boolean;
              value: Uint8Array | null;
            };
            if (done) this.push(null);
            else if (value) this.push(Buffer.from(value));
            else this.push(null); // Should not happen if done is false and value is null
          } catch (error) {
            logger.error('Error reading from response body in getAudioStream:', error);
            this.emit('error', error); // Propagate error to the stream
          }
        },
      });
    } catch (error: unknown) {
      logger.error('Error to fetch audio:', error);
      return undefined;
    }
  }
}
