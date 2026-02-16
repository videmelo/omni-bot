import logger from '../../utils/logger.js';
import { Track } from '../../modules/music/models/Track.js';
import { isBoolean } from 'node:util';
import { TrackData } from '@omni/shared';
import { Player } from '../../modules/music/Player.js';

import RateLimit from './middlewares/ratelimit.js';
import PlayerMiddleware from './middlewares/player.js';
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
  socket.use(PlayerMiddleware(socket, client));

  socket.on('queue:get', (callback?: (data?: unknown) => void) => {
    if (!socket.guild || !socket.voice) return callback?.(undefined);
    const player = client.getGuildPlayback(socket.guild);
    if (!player) return callback?.(undefined);

    logger.info(`user: ${socket.user} with ${socket.id} queue:get, in guild: ${socket.guild}`);
    callback?.({
      list: player.queue.tracks,
      current: {
        ...player.current,
        video: client.search.youtube.getVideo(player.current!),
      },
      next: player.queue.next(),
      repeat: player.queue.repeat,
      shuffled: player.queue.shuffled,
      previous: player.queue.previous(),
    });
  });

  socket.on('player:get', (callback?: (data?: unknown) => void) => {
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

  socket.on('search:top', (query: string, callback?: (result: unknown) => void) => {
    if (!socket.user) return callback?.(undefined);
    void client.search.resolve(query, { type: 'top' }).then((result) => callback?.(result));
  });

  socket.on('player:play', (track: TrackData) => {
    const player = socket.player as Player;
    if (!player) return;

    void player.play(new Track(track), { force: true });
  });

  socket.on('queue:new', (track: TrackData, callback?: (tracks: unknown) => void) => {
    const player = socket.player as Player;
    if (!player) return;

    const trackWithRequester = {
      ...track,
      requester: socket.user || '',
    };

    player.queue.new(new Track(trackWithRequester), {
      requester: socket.user,
    });
    socket.emit('status', {
      type: 'done',
      message: `New track added to queue!`,
    });
    callback?.(player.queue.tracks);
  });

  socket.on('player:skip', (index: number) => {
    const player = socket.player as Player;
    if (!player) return;

    const track = player.queue.get(index);
    if (!track) return;

    void player.play(track, { force: true });
  });

  socket.on('player:pause', () => {
    const player = socket.player as Player;
    if (!player) return;

    if (player.paused) return;
    player.pause();
  });

  socket.on('player:resume', () => {
    const player = socket.player as Player;
    if (!player) return;

    if (!player.paused) return;
    player.resume();
  });

  socket.on('player:next', () => {
    const player = socket.player as Player;
    if (!player) return;

    if (!player.current) return;
    const next = player.queue.next();
    if (next) void player.play(next, { force: true });
  });

  socket.on('player:previous', () => {
    const player = socket.player as Player;
    if (!player) return;

    if (!player.current) return;
    const previus = player.queue.previous();
    if (previus) void player.play(previus, { force: true });
  });

  socket.on('queue:repeat', (value: 'track' | 'off' | 'queue') => {
    const player = socket.player as Player;
    if (!player) return;

    player.queue.setRepeat(value);
  });

  socket.on('queue:shuffle', (value: boolean) => {
    const player = socket.player as Player;
    if (!player) return;

    if (!isBoolean(value)) return;
    if (value) player.queue.shuffle();
    else player.queue.reorder();
  });

  socket.on('player:volume', (value: number) => {
    const player = socket.player as Player;
    if (!player) return;

    player.setVolume(value);
  });

  socket.on('player:seek', (value: number) => {
    const player = socket.player as Player;
    if (!player) return;

    void player.seek(value);
  });
}
