import { Collection } from 'discord.js';
import { Track } from '../models/Track.js';
import { Playlist } from '../models/Playlist.js';
import Bot from '../core/Bot.js';

import * as Discord from 'discord.js';
import * as Voice from '@discordjs/voice';
import type { VoiceConnection, AudioPlayer, AudioResource } from '@discordjs/voice';

import logger from '../utils/logger.js';
import Playback from './Playback.js';

interface RadioOptions {
   id: string;
   genre: {
      id: string;
      name: string;
   };
   name: string;
   playlist: Playlist | Track[];
}

interface ConnectionVoice extends VoiceConnection {
   voice: Discord.VoiceBasedChannel;
}

export default class Radio extends Playback {
   public name: string;
   public connections: Collection<string, ConnectionVoice> = new Collection();
   public genre;

   private initied: boolean;

   constructor(client: Bot, { name, id, genre, playlist }: RadioOptions) {
      super(client, id, { autoleave: false, autoplay: false });

      this.name = name;
      this.genre = genre;

      this.initied = false;

      this.audioplayer = Voice.createAudioPlayer({
         behaviors: { noSubscriber: Voice.NoSubscriberBehavior.Play },
      });

      this.audioplayer
         .on(Voice.AudioPlayerStatus.Playing, () => {
            this.playing = true;
            logger.info(`[Radio: ${this.name}] Started playback: ${this.current!.name} by ${this.current!.artist.name}`);
            this.emit('radioNowPlaying', this.id, this.current);
            this.socket();
         })
         .on(Voice.AudioPlayerStatus.Idle, async () => {
            this.playing = false;
            this.socket();
            const next = this.queue.next();
            this.play(next!);
         })
         .on(Voice.AudioPlayerStatus.Buffering, () => {
            this.playing = false;
         })
         .on('error', (error) => {});

      this.queue.setRepeat('queue');
      this.queue.new(playlist, { requester: client.user?.id });
   }

   public socket() {
      const connections = this.connections.map((con) => con.voice.guild.id);
      this.client.socket.to(connections).emit('player:update');
   }

   public async connect(guild: string, channel: string) {
      if (!this.audioplayer) return;
      const playback = this.client.getGuildPlayback(guild);
      if (playback) {
         if (playback.isRadio()) {
            if (playback.id === this.id) {
               return this;
            } else {
               playback.connections.get(guild)?.destroy();
               playback.connections.delete(guild);
            }
         } else if (playback.isPlayer()) {
            this.client.destroyGuildPlayer(playback.guild);
         }
      }

      try {
         if (!this.initied) this.initRadioStation();
         const voice = await this.client.channels.fetch(channel);
         if (!voice?.isVoiceBased()) throw new Error('Invalid voice channel ID.');

         const connection = Voice.joinVoiceChannel({
            channelId: voice.id,
            guildId: voice.guild.id,
            adapterCreator: voice.guild.voiceAdapterCreator,
            selfDeaf: true,
         }) as ConnectionVoice;
         connection.voice = voice;
         connection.subscribe(this.audioplayer);
         this.connections.set(guild, connection);

         connection.on(Voice.VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            if (newState.reason === Voice.VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
               logger.warn(`[Radio: ${this.name}] Disconnected from guild ${guild} (channel ${channel}).`);
               this.connections.delete(guild);
               this.emit('radioGuildDisconnected', this.id, guild, channel);
               this.socket();
            } else {
               logger.warn(`[Radio: ${this.name}] Connection to guild ${guild} changed state: ${oldState.status} -> ${newState.status}`);
            }
         });

         logger.info(`[Radio: ${this.name}] Connected to guild ${guild} in channel ${channel}.`);
         this.socket();
         return this;
      } catch (error: any) {
         logger.error(`[Radio: ${this.name}] Failed to connect to guild ${guild}: ${error.message}`);
         return;
      }
   }

   public disconnect(guild: string): void {
      const connection = this.connections.get(guild);
      if (connection) {
         connection.destroy();
         this.connections.delete(guild);
         logger.info(`[Radio: ${this.name}] Disconnected from guild ${guild}.`);
         this.socket();
      } else {
         logger.warn(`[Radio: ${this.name}] Attempted to disconnect from guild ${guild}, but no connection found.`);
      }
   }

   public async play(track: Track, seek: number = 0): Promise<Track | undefined> {
      try {
         if (!this.initied) return;

         if (!(track instanceof Track)) {
            logger.error(`[Radio: ${this.name}] Provided item is not a Track object.`);
            return;
         }
         if (!this.audioplayer) {
            logger.error(`[Radio: ${this.name}] AudioPlayer not initialized.`);
            return;
         }

         track = await this.handleTrackData(track);

         if (!this.queue.tracks.has(track.id)) return;

         const stream = await this.getAudioStream(track, seek);
         if (!stream) {
            logger.error(`[Radio: ${this.name}] Failed to get audio stream for track: ${track.name}`);
            return;
         }

         this.audioresource = Voice.createAudioResource(stream.opus, {
            inlineVolume: true,
            inputType: Voice.StreamType.OggOpus,
            metadata: track,
         });

         if (this.playing) this.stopAudioPlayer();

         this.audioplayer.play(this.audioresource);
         this.current = track;

         if (!track.cached) this.cache.archive(track, stream.opus, stream.chunks);

         this.socket();
         return track;
      } catch (error: any) {
         logger.error(`[Radio: ${this.name}] Error playing track: ${error.message}`);
         return undefined;
      }
   }

   async initRadioStation() {
      if (this.initied) return;

      const session = this.getTimeSession();
      if (!session) return;
      this.initied = true;
      await this.play(session.current, session.position);
   }

   public isRadio(): this is Radio {
      return true;
   }

   getTimeSession() {
      if (this.initied) return { current: this.current!, position: this.current?.duration! - this.audioresource?.playbackDuration! };
      const now = new Date();
      const time = now.getTime() - new Date(now.setHours(0, 0, 0, 0)).getTime();

      const tracks = [...this.queue.tracks.values()];
      let count: number = 0;
      let current: Track;
      let position: number = 0;

      function loop() {
         for (const track of tracks) {
            count = count + track.duration;
            if (count >= time) {
               current = track;
               position = count - time;
               break;
            }
         }
         if (count < time) loop();
         return;
      }

      loop();

      if (!current!) return;

      return { current, position };
   }
}
