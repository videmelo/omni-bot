import 'dotenv/config';

import { Client, Collection, GatewayIntentBits, VoiceBasedChannel, TextBasedChannel } from 'discord.js';

import Interactions from './loaders/Interactions.js';
import Events from './loaders/Events.js';
import fs from 'node:fs/promises';

import { api, io, server } from '../api/index.js';
import logger from '../utils/logger.js';
import Verify from '../utils/errors.js';
import { Player, Radio, Track, Search, RadioPlaylist } from '../modules/music/index.js';
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
   public players: Collection<string, Player>;
   public radios: Collection<string, Radio>;
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

      this.players = new Collection();
      this.radios = new Collection();
      this.interactions = new Interactions(this);
      this.verify = new Verify();
      this.embed = new Embed();
      this.button = new Button();
      this.events = new Events(this);
      this.search = new Search({
         spotify: {
            id: this.config.spotify.id,
            secret: this.config.spotify.secret,
         },
      });
      this.socket = io;
   }

   async initGuildPlayer(voice: VoiceBasedChannel, channel?: TextBasedChannel) {
      if (!voice) return null;

      const player = new Player(this, {
         voice: voice.id,
         guild: voice.guild.id,
         channel: channel ? channel.id : undefined,
      });
      this.players.set(voice.guild.id, player);

      await player.connect(voice.id);
      player.on('disconnect', () => {
         this.players.delete(voice.guild.id);
      });

      return player;
   }

   async destroyGuildPlayer(guild: string) {
      const player = this.players.get(guild);
      if (!player) return;
      player.disconnect();
      this.players.delete(guild);
   }

   async initRadios() {
      const data = await fs.readFile('radios.json', 'utf8');
      const radios = JSON.parse(data) as RadioPlaylist[];
      radios.map((item) => {
         item.playlists.map((list) => {
            if (!list.tracks?.length) return;
            const radio = new Radio(this, {
               genre: { id: item.genre.id.toString(), name: item.genre.name },
               id: list.id.toString(),
               playlist: list.tracks.map((track) => new Track(track)),
               name: list.name,
            });
            this.radios.set(radio.id, radio);
         });
      });
   }

   async buildRadios() {
      const data = await fs.readFile('lists.json', 'utf8');
      const list = JSON.parse(data);

      const radios = await Promise.all(
         list.map(async (radio: any) => ({
            ...radio,
            playlists: await Promise.all(
               radio.playlists.map(async (playlist: { name: string; ids: number[] }) => ({
                  name: playlist.name,
                  id: playlist.ids.join(),
                  tracks: (await Promise.all(playlist.ids.map(async (id: any) => await this.search.deezer.getPlaylistTracks(id)))).flat(),
               }))
            ),
         }))
      );
      await fs.writeFile('radios.json', JSON.stringify(radios, null, 2), 'utf8');
   }

   getGuildPlayback(guild: string): Radio | Player | null {
      const player = this.players.get(guild);
      if (player) return player;

      const radio = this.radios.find((session) => session.connections.get(guild));
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
