import GuildSocket from './guilds.js';
import UserSocket from './user.js';
import PlayerSocket from './player.js';

import { Socket } from 'socket.io';
import RadioSocket from './radio.js';
import Bot from '../../core/Bot.js';

import { Player, Radio } from '../../modules/music/index.js';

export interface SocketData extends Socket {
  user?: string;
  guild?: string;
  voice?: string;
  warns?: number;
  player?: Player | Radio;
}

export default function RegisterSocketHandlers(socket: SocketData, client: Bot) {
  GuildSocket(socket, client);
  PlayerSocket(socket, client);
  RadioSocket(socket, client);
  UserSocket(socket);
}
