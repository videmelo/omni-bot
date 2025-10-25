import Bot from '../../core/Bot.js';

import { Stream } from 'node:stream';

import * as Voice from '@discordjs/voice';

import type { VoiceConnection, AudioPlayer } from '@discordjs/voice';

import ffmpeg from 'ffmpeg-static';
import fluent from 'fluent-ffmpeg';

import logger from '../../utils/logger.js';
import EventEmitter from 'node:events';

import { Queue, Cache, Player, Radio, Track } from './index.js';

interface PlayerOptions {
   autoplay?: boolean;
   autoleave?: boolean;
}

export class Playback extends EventEmitter {
   public client: Bot;

   public channel?: string;
   public volume: number;
   public autoplay: boolean;
   public autoleave: boolean;

   public queue: Queue;
   public id: string;

   public connection?: VoiceConnection;
   public audioplayer?: AudioPlayer;
   public audioresource?: Voice.AudioResource;

   public playing: boolean;
   public paused: boolean;
   public buffering: boolean;

   public current?: Track;
   public metadata: any;

   public position: number;
   public cache: Cache;

   constructor(client: Bot, id: string, { autoplay, autoleave }: PlayerOptions) {
      super();

      this.client = client;
      this.id = id;

      this.volume = 100;
      this.autoplay = autoplay || false;
      this.autoleave = autoleave || false;

      this.playing = false;
      this.paused = false;

      this.buffering = false;

      this.queue = new Queue(id, this);
      this.cache = new Cache(client);

      this.position = 0;
   }

   socket(): void {}

   public stopAudioPlayer() {
      if (!this.audioplayer) return;
      this.audioplayer.stop();
      this.playing = false;
      this.socket();
   }

   public async handleTrackData(track: Track): Promise<Track> {
      const data = this.queue.tracks.get(track.id) ?? this.client.search.getcache(track.id);
      if (!data) throw new Error('Track not found!');

      const cached = await this.cache.getTrackData(data);
      if (cached) return cached;

      if (data.metadata?.id) return data;

      const query = `${data.artist.name} · ${data.name} Official Audio`;
      const result = await this.client.search.youtube.search(query);
      if (!result) throw new Error('No search results found');

      const dated = new Track({
         ...data,
         metadata: {
            ...result,
         },
      });

      const cache = await this.cache.getTrackData(dated);
      if (cache) return cache;
      return dated;
   }

   public async getAudioStream(track: Track, seek: number = 0) {
      const stream = new Stream.PassThrough();
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));

      if (track.cached) {
         if (track.streamable) {
            const streamable = await this.cache.getAudioStream(track.streamable);
            if (streamable) streamable.pipe(stream);
            else {
               stream.destroy(new Error('Failed to create Stream from Cache.'));
               return; // TODO: handle this case properly
            }
         } else {
            stream.destroy(new Error('Track is marked as cached but has no streamable ID.'));
            return; // TODO: handle this case properly
         }
      } else if (track.metadata?.url) {
         const streamable = await this.client.search.youtube.getAudioStream(track.metadata.url);
         if (streamable) streamable.pipe(stream);
         else {
            stream.destroy(new Error('Failed to create Stream from YouTube.'));
            return; // TODO: handle this case properly
         }
      }

      this.position = seek;
      const opus = fluent({ source: stream })
         .setFfmpegPath(ffmpeg as unknown as string)
         .format('opus')
         .seek(seek / 1000)
         .on('error', (err: any) => {
            if (err instanceof Error && err?.message?.includes('Premature close')) return;
            logger.error(`[Playback: ${this.id}] ffmpeg error in getAudioStream:`, err);
         });

      const opusStream = new Stream.PassThrough();
      opus.pipe(opusStream);

      return { opus: opusStream, chunks };
   }

   public getPosition() {
      return this.audioresource?.playbackDuration! + this.position;
   }

   public setVolume(value: number) {
      if (isNaN(value)) return;
      if (value < 0 || value > 100) return;
      if (value == this.volume) return;
      if (this.audioresource) {
         const volume = this.audioresource.volume;
         if (volume) {
            volume.setVolume(value / 100);
            this.volume = value;
            this.socket();
         } else {
            logger.warn('Audio resource volume is not set.');
         }
      }
   }

   isPlayer(): this is Player {
      return false;
   }

   isRadio(): this is Radio {
      return false;
   }

   public setAutoplay(value: boolean) {
      this.autoplay = value;
   }
   public setAutoleave(value: boolean) {
      this.autoleave = value;
   }
}
