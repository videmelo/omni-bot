import Bot from '../core/Bot.js';
import { Track } from '../models/Track.js';

import * as Discord from 'discord.js';
import * as Voice from '@discordjs/voice';

import logger from '../utils/logger.js';
import Playback from './Playback.js';

interface PlayerOptions {
   voice: string;
   guild: string;
   channel?: string;
   volume?: number;
   autoplay?: boolean;
   autoleave?: boolean;
}

export default class Player extends Playback {
   public voice: string;
   public guild: string;
   public channel?: string;

   constructor(client: Bot, { guild, voice, channel, volume, autoplay, autoleave }: PlayerOptions) {
      super(client, guild, { autoplay, autoleave });
      this.guild = guild;
      this.voice = voice;
      this.channel = channel;
   }

   public socket() {
      this.client.socket.to(this.guild).emit('player:update');
   }

   public async connect(channel: string) {
      try {
         const voice = await this.client.channels.fetch(channel);
         if (!voice?.isVoiceBased()) throw new Error('Invalid VoiceChannel');

         const existing = this.client.getGuildPlayback(voice.id);
         if (existing?.isRadio()) existing.connections.get(voice.id)?.destroy();
         else if (existing?.isPlayer()) if (existing.connection) existing.destroy();

         this.connection = Voice.joinVoiceChannel({
            channelId: voice.id,
            guildId: voice.guild.id,
            adapterCreator: voice.guild.voiceAdapterCreator,
         });
         this.voice = voice.id;

         this.metadata = {
            voice,
         };

         this.audioplayer = Voice.createAudioPlayer({
            behaviors: { noSubscriber: Voice.NoSubscriberBehavior.Play },
         });
         this.audioplayer
            .on(Voice.AudioPlayerStatus.Playing, () => {
               this.playing = true;
               this.paused = false;
               this.emit('nowPlaying', this, this.current);
               this.socket();
            })
            .on(Voice.AudioPlayerStatus.Idle, () => {
               this.playing = false;
               this.socket();

               const next = this.queue.next();
               if (!next) return this.emit('queueEnd', this);
               this.socket();
               this.play(next);
            })
            .on(Voice.AudioPlayerStatus.Buffering, () => {
               this.playing = false;
            });
         this.socket();
      } catch (error: any) {
         logger.error(error);
      }
   }

   public disconnect() {
      if (!this.connection) return;
      this.connection.destroy();
      this.socket();
   }

   public destroy() {
      if (!this.connection) return;
      this.connection.destroy();
      this.client.players.delete(this.guild);
   }

   public async play(
      track: Track,
      metadata: { seek?: number; force?: boolean; requester?: string } = {
         seek: 0,
         force: false,
      }
   ): Promise<Track | undefined> {
      this.client.search.deezer.search(`${track.artist.name} ${track.name}`);
      try {
         if (!(track instanceof Track)) throw new Error('Track is not a Track!');
         if (!this.audioplayer || !this.connection) throw new Error('Player not initied');
         if (this.buffering) return;

         track = await this.handleTrackData(track);
         if (this.playing || this.queue.tracks.size === 0) track = this.queue.new(track, metadata)!;
         if (this.playing) if (!metadata.seek && !metadata.force) return track;

         this.buffering = true;

         const stream = await this.getAudioStream(track, metadata.seek);
         if (!stream) {
            this.buffering = false;
            return;
         }

         this.audioresource = Voice.createAudioResource(stream.opus, {
            inlineVolume: true,
            inputType: Voice.StreamType.OggOpus,
            metadata: track,
         });

         this.audioresource.volume?.setVolume(this.volume ? this.volume / 100 : 1);

         if (this.playing) this.stopAudioPlayer();
         this.audioplayer.play(this.audioresource);
         this.connection.subscribe(this.audioplayer);
         this.current = track;

         if (!track.cached) this.cache.archive(track, stream.opus, stream.chunks);
         this.buffering = false;
         return track;
      } catch (erro: any) {
         logger.error('error', erro);
      }
   }

   public async seek(time: number) {
      if (!this.current) return;
      await this.play(this.current!, { seek: time });

      this.socket();
   }

   public pause() {
      if (this.audioplayer) {
         this.audioplayer.pause();
         this.paused = true;
         this.socket();
      } else {
         logger.warn('Audio player is not initialized.');
      }
   }

   public resume() {
      if (this.audioplayer) {
         this.audioplayer.unpause();
         this.paused = false;
         this.socket();
      } else {
         logger.warn('Audio player is not initialized.');
      }
   }

   public setVoiceChannel(id: string) {}
   public setTextChannel(id: string) {
      this.channel = id;
   }

   public isPlayer(): this is Player {
      return true;
   }
}
