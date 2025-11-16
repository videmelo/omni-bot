import 'dotenv/config';

import { Client, Collection, GatewayIntentBits } from 'discord.js';

import Interactions from './loaders/Interactions.js';
import Events from './loaders/Events.js';
import fs from 'node:fs/promises';

import { api, io, server } from '../api/index.js';
import logger from '../utils/logger.js';
import Verify from '../utils/errors.js';
import { Player, Radio, Search, PlayerManager, RadioManager } from '../modules/music/index.js';
import Embed from '../utils/embed.js';
import Button from '../utils/button.js';
import RegisterSocketHandlers from '../api/sockets/index.js';

export default class Bot extends Client {
   config: {
      token: string;
      id: string;
      port: string | number;
      cache: string;
      spotify: {
         id: string;
         secret: string;
      };
   };
   public players: PlayerManager;
   public radios: RadioManager;
   public interactions: Interactions;
   public events: Events;
   public socket: typeof io;
   public verify: Verify;
   public search: Search;
   public embed: Embed;
   public button: Button;

   constructor() {
      super({
         intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers],
      });

      this.config = {
         token: process.env.DISCORD_TOKEN || '',
         id: process.env.DISCORD_ID || '',
         port: process.env.PORT || 8043,
         cache: process.env.DISCORD_CACHE_CHANNEL || '',
         spotify: {
            id: process.env.SPOTIFY_ID || '',
            secret: process.env.SPOTIFY_SECRET || '',
         },
      };

      this.interactions = new Interactions(this);
      this.events = new Events(this);

      this.players = new PlayerManager(this);
      this.radios = new RadioManager(this);
      this.search = new Search({
         spotify: {
            id: this.config.spotify.id,
            secret: this.config.spotify.secret,
         },
      });

      this.verify = new Verify();
      this.embed = new Embed();
      this.button = new Button();

      this.socket = io;
   }

   getGuildPlayback(guild: string): Radio | Player | null {
      const player = this.players.get(guild);
      if (player) return player;

      const radio = this.radios.list.find((session) => session.connections.get(guild));
      if (radio) return radio;
      return null;
   }

   override async login(token?: string): Promise<string> {
      try {
         logger.info('Started loading modules');
         await this.events.load();
         await this.interactions.load();

         const key = token ?? this.config.token;
         const result = await super.login(key);
         server.listen(this.config.port, () => {
            logger.done(`Server is running on port: ${this.config.port}`);
         });

         io.on('connection', (socket) => {
            RegisterSocketHandlers(socket, this);
         });

         return result;
      } catch (error: any) {
         logger.error('Error logging in.', error);
         throw error;
      }
   }
}
