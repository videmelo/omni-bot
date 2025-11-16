import Bot from '../../Bot.js';
import { Player, Track } from '../../../modules/music/index.js';

import Event from '../../base/Event.js';

export default class QueueEnd extends Event {
   constructor() {
      super({ name: 'queueEnd' });
   }

   async execute(client: Bot, player: Player) {
      setTimeout(() => {
         if (!player.playing) return client.players.destroy(player.guild);
      }, 180000);

      if (!player.channel) return;

      const Embed = client.embed.new({
         description: 'No more songs in the queue. Leaving the voice channel in 3 minutes if nothing’s added.',
      });

      const channel = await client.channels.fetch(player.channel);
      if (!channel?.isSendable()) return;

      await channel.send({
         embeds: [Embed],
      });
   }
}
