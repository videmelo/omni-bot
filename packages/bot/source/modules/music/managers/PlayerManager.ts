import { Collection, TextBasedChannel, VoiceBasedChannel } from 'discord.js';

import { Player } from '../index.js';
import Bot from '../../../core/Bot.js';

export class PlayerManager {
   public list: Collection<string, Player>;
   private client: Bot;
   constructor(client: Bot) {
      this.list = new Collection();
      this.client = client;
   }

   async set(voice: VoiceBasedChannel, channel?: TextBasedChannel) {
      if (!voice) return null;

      const player = new Player(this.client, {
         voice: voice.id,
         guild: voice.guild.id,
         channel: channel ? channel.id : undefined,
      });
      this.list.set(voice.guild.id, player);

      await player.connect(voice.id);
      player.on('disconnect', () => {
         this.list.delete(voice.guild.id);
      });

      return player;
   }

   get(guildid: string) {
      return this.list.get(guildid);
   }

   async destroy(guild: string) {
      const player = this.list.get(guild);
      if (!player) return;
      player.disconnect();
      this.list.delete(guild);
   }
}
