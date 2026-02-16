import logger from '../../utils/logger.js';
import { SocketData } from './index.js';

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export default function UserSocket(socket: SocketData) {
  socket.on('user:set', (token: string, callback?: (user: User | null) => void) => {
    void (async () => {
      try {
        if (socket?.user || !token) return;
        const response = await fetch('https://discord.com/api/v10/users/@me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch Discord user.');

        const user = (await response.json()) as User;

        socket.user = user.id;
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await socket.join(user.id);

        logger.info(`user: ${user.username}, connected with socket: ${socket.id}`);

        if (callback) callback(user);
      } catch (err) {
        logger.error(`Error authenticating Discord user: ${String(err)}`);
        if (callback) callback(null);
      }
    })();
  });
}
