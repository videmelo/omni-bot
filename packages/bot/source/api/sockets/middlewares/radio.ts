import { SocketData } from '../index.js';
import Bot from '../../../core/Bot.js';
import { syncVoiceChannel } from '../guilds.js';

export default function RadioMiddleware(socket: SocketData, client: Bot) {
    return (packet: [string, ...unknown[]], next: (err?: Error) => void) => {
        void (async () => {
            const [event] = packet;

            const events = [
                'radio:join',
            ];

            if (!events.includes(event)) return next();

            try {
                if (!socket.voice) {
                    await syncVoiceChannel(socket, client);
                    if (!socket.voice) return;
                }

                if (!socket.guild)
                    return socket.emit('status', {
                        type: 'error',
                        message: 'Please connect to a voice channel first.',
                    });

                next();
            } catch {
                socket.emit('status', {
                    type: 'error',
                    message: 'An internal error occurred while validating the request.',
                });
            }
        })();
    };
}
