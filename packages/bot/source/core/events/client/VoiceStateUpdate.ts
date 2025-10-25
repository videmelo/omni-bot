import Bot from '../../Bot.js';
import * as Discord from 'discord.js';
import Event from '../../base/Event.js';

export default class VoiceStateUpdate extends Event {
   constructor() {
      super({ name: 'voiceStateUpdate' });
   }

   async execute(client: Bot, old: Discord.VoiceState, now: Discord.VoiceState) {
      const player = client.players.get(now.guild.id);
      if (!player) return;
      let members;
      if (client.user!.id == now.id) {
         members = [
            ...Array.from(old?.channel?.members?.values() ?? []).map((member: Discord.GuildMember) => member.id),
            ...Array.from(now?.channel?.members?.values() ?? []).map((member: Discord.GuildMember) => member.id),
         ];

         const clients = [now.guild.id, `${old?.channel?.id}`, `${now?.channel?.id}`, ...members];
         client.socket.to(clients).emit('bot:voice.update');

         if (old?.channel?.id && !now?.channel?.id) return player.disconnect();
         if (old?.channel?.id && now?.channel?.id && old?.channel?.id !== now?.channel?.id) return player.setVoiceChannel(now.channel.id);
      }

      client.socket.to(now.id).emit('user:voice.update');
   }
}
