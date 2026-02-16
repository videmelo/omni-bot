import { SocketData } from '../index.js';
import Bot from '../../../core/Bot.js';
import { syncVoiceChannel } from '../guilds.js';

export default function PlayerMiddleware(socket: SocketData, client: Bot) {
    return (packet: [string, ...unknown[]], next: (err?: Error) => void) => {
        void (async () => {
            const [event] = packet;

            const events = [
                'player:play',
                'queue:new',
                'player:skip',
                'player:pause',
                'player:resume',
                'player:next',
                'player:previous',
                'queue:repeat',
                'queue:shuffle',
                'player:volume',
                'player:seek',
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

                let player = client.getGuildPlayback(socket.guild);

                if (!player) {
                    if (socket.voice) {
                        const channel = await client.channels.fetch(socket.voice);
                        if (channel?.isVoiceBased()) {
                            const newPlayer = await client.players.set(channel);
                            if (newPlayer) player = newPlayer;
                        }
                    } else {
                        return;
                    }
                }

                if (!player)
                    return socket.emit('status', {
                        type: 'error',
                        message: 'There is no music playing in this server.',
                    });

                if (player.isRadio())
                    return socket.emit('status', {
                        type: 'error',
                        message: "You are in a radio channel, you can't control the player.",
                    });

                socket.player = player;

                const notPlayingEvents = ['player:pause', 'player:resume', 'player:next', 'player:previous'];

                if (notPlayingEvents.includes(event)) {
                    if (!player.playing)
                        return socket.emit('status', {
                            type: 'error',
                            message: 'There is no music playing in this server.',
                        });
                }

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
