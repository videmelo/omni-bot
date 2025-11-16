import logger from '../../utils/logger.js';
import { Track } from '../../modules/music/models/Track.js';
import { isBoolean } from 'node:util';

import RateLimit from './middlewares/ratelimit.js';
import { SocketData } from './index.js';
import Bot from '../../core/Bot.js';

export default function PlayerSocket(socket: SocketData, client: Bot) {
   const middleware = {
      ignore: ['player:get'],
      custom: {
         'player:play': 3,
         'player:next': 3,
         'player:previous': 3,
         'player:seek': 3,
      },
   };
   socket.use(RateLimit(socket, middleware));

   async function validate() {
      if (!socket?.user) {
         const error = { status: 404, message: 'userNotFound' };
         socket.emit('status', { type: 'error', ...error });
         return { error };
      }

      if (!socket.guild || !socket?.voice) {
         const error = { status: 403, message: 'userNotInVoice' };
         socket.emit('status', { type: 'error', ...error });
         return { error };
      }

      const voice = await client.channels.fetch(socket.voice);
      if (!voice?.isVoiceBased()) return;

      let player = client.getGuildPlayback(socket.guild);
      if (player) {
         if (player.isRadio()) {
            const error = { status: 403, message: 'isRadio' };
            socket.emit('status', { type: 'error', ...error });
            return { error };
         }
      }

      if (!player) {
         const playback = await client.players.set(voice);
         if (playback) {
            player = playback;
         } else {
            const error = { status: 500, message: 'playerInitFailed' };
            socket.emit('status', { type: 'error', ...error });
            return { error };
         }
      }

      if (voice.id !== player?.voice) {
         const error = { status: 403, message: 'playerNotInitied' };
         socket.emit('status', { type: 'error', ...error });
         return { error };
      }

      const requester = voice.members.get(socket.user);
      if (!requester) {
         const error = { status: 403, message: 'userNotInPlayerChannel' };
         socket.emit('status', { type: 'warn', ...error });
         return { error };
      }

      return { player, voice, requester };
   }

   socket.on('queue:get', async (callback?: (data?: any) => void) => {
      if (!socket.guild || !socket.voice) return callback?.(undefined);
      const player = client.getGuildPlayback(socket.guild);
      if (!player) return callback?.(undefined);

      logger.info(`user: ${socket.user} with ${socket.id} queue:get, in guild: ${socket.guild}`);
      callback?.({
         list: player.queue.tracks,
         current: {
            ...player.current,
            video: await client.search.youtube.getVideo(player.current!),
         },
         next: player.queue.next(),
         repeat: player.queue.repeat,
         shuffled: player.queue.shuffled,
         previous: player.queue.previous(),
      });
   });

   socket.on('player:get', (callback?: (data?: any) => void) => {
      if (!socket.guild || !socket.voice || !socket.user) return callback?.(undefined);
      const player = client.getGuildPlayback(socket.guild);
      if (!player) return callback?.(undefined);

      logger.info(`user: ${socket.user} with ${socket.id} player:get, in guild: ${socket.guild}`);
      callback?.({
         metadata: player.metadata,
         repeat: player.queue.repeat,
         position: player.getPosition() || 0,
         playing: player.playing,
         paused: player.paused,
         volume: player.volume,
      });
   });

   socket.on('search:top', async (query: string, callback?: (result: any) => void) => {
      if (!socket.user) return callback?.(undefined);
      const result = await client.search.resolve(query, { type: 'top' });
      callback?.(result);
   });

   socket.on('player:play', async (track: any, callback?: Function) => {
      const data = await validate();
      if (data?.error || !data) return;
      data.player.play(new Track(track), { force: true });
   });

   socket.on('queue:new', async (track: any, callback?: (tracks: any) => void) => {
      const data = await validate();
      if (data?.error || !data) return;

      track = {
         ...track,
         resquester: socket.user || 0,
      };

      data.player.queue.new(new Track(track), { requester: socket.user });
      socket.emit('status', {
         type: 'done',
         message: `New track added to queue!`,
      });
      callback?.(data.player.queue.tracks);
   });

   socket.on('player:skip', async (index: number) => {
      const data = await validate();
      if (data?.error || !data) return;

      const track = data.player.queue.get(index);
      if (!track) return;

      data.player.play(track, { force: true });
   });

   socket.on('player:pause', async () => {
      const data = await validate();
      if (data?.error || !data) return;
      if (data.player.paused) return;
      data.player.pause();
   });

   socket.on('player:resume', async () => {
      const data = await validate();
      if (data?.error || !data) return;
      if (!data.player.paused) return;
      data.player.resume();
   });

   socket.on('player:next', async () => {
      const data = await validate();
      if (data?.error || !data) return;
      if (!data.player.current) return;
      const next = data.player.queue.next();
      if (next) data.player.play(next, { force: true });
   });

   socket.on('player:previous', async () => {
      const data = await validate();
      if (data?.error || !data) return;
      if (!data.player.current) return;
      const previus = data.player.queue.previous();
      if (previus) data.player.play(previus, { force: true });
   });

   socket.on('queue:repeat', async (value: 'track' | 'off' | 'queue') => {
      const data = await validate();
      if (data?.error || !data) return;
      data.player.queue.setRepeat(value);
   });

   socket.on('queue:shuffle', async (value: boolean) => {
      const data = await validate();
      if (data?.error || !data) return;
      if (!isBoolean(value)) return;
      value ? data.player.queue.shuffle() : data.player.queue.reorder();
   });

   socket.on('player:volume', async (value: number) => {
      const data = await validate();
      if (data?.error || !data) return;

      data.player.setVolume(value);
   });

   socket.on('player:seek', async (value: number) => {
      const data = await validate();
      if (data?.error || !data) return;
      data.player.seek(value);
   });
}
