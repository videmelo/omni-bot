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
import { Track } from '../models/Track.js';
import { AttachmentBuilder, TextChannel } from 'discord.js';

import Bot from '../core/Bot.js';
import logger from '../utils/logger.js';

interface CachedTrack {
   id: string; // source id
   encoded: string; // encoded track
   key: string; // encoded query
   message: string; // message id
   stream: string; // youtube id
}

export default class Cache {
   private client: Bot;
   private channel: string;

   constructor(client: Bot) {
      this.client = client;
      this.channel = client.config.cache;
   }

   async archive(track: Track, stream: Stream.PassThrough, chunks: Buffer[]) {
      if (!stream) return;

      const channel = await this.client.channels.fetch(this.channel).catch((err: any) => logger.error('Cache: Invalid Text Channel ID'));

      if (!channel) throw new Error('Text Channel not found!');
      if (!channel.isSendable()) return;

      await new Promise((resolve, reject) => {
         stream.once('end', resolve);
         stream.once('error', reject);
      });

      const buffered = Buffer.concat(chunks);
      const attachment = new AttachmentBuilder(buffered, { name: `${track.id}.opus` });

      const message = await channel.send({
         content: `${track.name} - ${track.artist.name}`,
         files: [attachment],
      });

      const encoded = Buffer.from(JSON.stringify({ ...track })).toString('base64');

      try {
         const file = 'tracks.json';
         const existing = await fs
            .stat(file)
            .then(() => true)
            .catch(() => false);
         const json: CachedTrack[] = existing ? JSON.parse(await fs.readFile(file, 'utf8')) : [];

         json.push({
            id: track.id,
            key: track.key!,
            encoded: encoded,
            message: message.id,
            stream: track.metadata!.id,
         });

         await fs.writeFile(file, JSON.stringify(json, null, 2), 'utf8');
      } catch (error: any) {
         logger.error('Error to save cache:', error);
      }
   }

   async getTrackData(track: Track): Promise<Track | undefined> {
      try {
         const data = await fs.readFile('tracks.json', 'utf8');
         const tracks: CachedTrack[] = JSON.parse(data);
         const cached = tracks.find((item) => item.id === track.id || item.key === track.key || item.stream === track.metadata?.id);
         if (!cached) return;

         const channel = (await this.client.channels.fetch(this.channel)) as TextChannel;
         if (!channel) return;

         const message = await channel.messages.fetch(cached.message);
         const url = message.attachments.first()?.url;
         if (!url) return;

         const decoded = JSON.parse(Buffer.from(cached.encoded, 'base64').toString('utf8'));
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
               const { done, value } = await reader.read();
               if (done) this.push(null);
               else this.push(Buffer.from(value));
            },
         });
      } catch (error: any) {
         logger.error('Error to fetch audio:', error);
         return undefined;
      }
   }
}
