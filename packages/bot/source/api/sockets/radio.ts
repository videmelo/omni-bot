import RadioMiddleware from './middlewares/radio.js';
import RateLimit from './middlewares/ratelimit.js';
import { SocketData } from './index.js';
import Bot from '../../core/Bot.js';

export default function RadioSocket(socket: SocketData, client: Bot) {
  const middleware = {
    ignore: ['radios:get'],
    custom: {
      'radio:join': 3,
    },
  };

  socket.use(RateLimit(socket, middleware));
  socket.use(RadioMiddleware(socket, client));

  socket.on('radio:join', async (id: string, callback: () => void) => {
    if (!socket.voice) return;

    const voice = await client.channels.fetch(socket.voice);
    if (!voice?.isVoiceBased()) return;

    const radio = client.radios.get(id);
    await radio?.connect(voice.guild.id, voice.id);
    callback?.();
  });

  socket.on('radios:get', (callback?: (data?: unknown) => void) => {
    callback?.(
      client.radios.list.map((radio) => {
        const session = radio.getTimeSession();
        return {
          id: radio.id,
          name: radio.name,
          genre: radio.genre,
          connections: radio.connections.map((con) => con.voice?.id),
          position: session?.position,
          queue: {
            tracks: radio.queue.tracks,
            current: session?.current,
          },
        };
      }),
    );
  });
}
