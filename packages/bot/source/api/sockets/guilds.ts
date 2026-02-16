import { Guild, GuildMember, VoiceChannel } from 'discord.js';

import logger from '../../utils/logger.js';
import Bot from '../../core/Bot.js';
import { SocketData } from './index.js';

export default function GuildSocket(socket: SocketData, client: Bot) {
  socket.on('disconnect', () => {
    void (async () => {
      if (socket?.guild) {
        logger.info(`disconnect: ${socket.guild}, user: ${socket.user} with ${socket.id}`);
        socket.voice = undefined;
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await socket.leave(socket.guild);
      }
    })();
  });

  socket.on('voice:join', (id: string, callback?: () => void) => {
    void (async () => {
      const channel = await client.channels.fetch(id);
      if (!channel || !channel.isVoiceBased()) return;

      await client.players.set(channel);
      if (typeof callback === 'function') callback();
    })();
  });

  socket.on('voice:sync', (callback?: () => void) => {
    void syncVoiceChannel(socket, client, callback);
  });
}

export async function syncVoiceChannel(socket: SocketData, client: Bot, callback?: () => void) {
  const status = Date.now();
  if (!socket.voice) {
    socket.emit('status', {
      type: 'async',
      message: 'Synchronizing with your voice channel',
      async: status,
    });
  }
  
  if (!socket.user) {
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (socket.user) break;
    }
  }

  const members = client.guilds.cache.map(async (guild: Guild) => {
    try {
      if (!socket.user) return null;
      const member: GuildMember = await guild.members.fetch(socket.user);
      if (member?.voice?.channel) return member;
    } catch (err) {
      logger.error(String(err));
    }
    return null;
  });

  const resolved = (await Promise.all(members)).filter(Boolean) as GuildMember[];
  const member = resolved[0];

  if (!member) {
    if (socket.voice) {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await socket.leave(socket.guild!);
      socket.voice = undefined;
      socket.guild = undefined;
    }

    if (typeof callback === 'function') callback();
    return socket.emit('status', {
      type: 'error',
      message: `I couldn't find you, make sure you're on a voice channel where I can see you!`,
      respond: status,
    });
  }

  const channel = member.voice.channel as VoiceChannel;
  const guild = channel.guild;
  const queue = client.players.get(guild.id);

  if (queue?.voice && queue.voice !== channel.id) {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await socket.leave(socket.guild!);
    socket.voice = undefined;
    socket.guild = undefined;

    if (typeof callback === 'function') callback();
    return socket.emit('status', {
      type: 'warn',
      message: `I'm in another voice channel, on the server you're on, join to listen to music!`,
      respond: status,
    });
  }

  if (!socket.voice || !socket.guild) {
    await socket.join(guild.id);
    socket.guild = guild.id;
    socket.voice = channel.id;

    socket.emit('status', {
      type: 'done',
      message: queue?.voice === channel.id ? `Playing in [${channel.name}]` : undefined,
      respond: status,
    });

    logger.info(
      `user: ${socket.user} with ${socket.id} voice:sync, guild: ${socket.guild} in voice: ${socket.voice}`,
    );

    if (typeof callback === 'function') return callback();
  }

  socket.emit('status', {
    type: 'done',
    respond: status,
  });

  if (typeof callback === 'function') return callback();
}
