import Bot from '../../Bot.js';
import { Player, Track } from '../../../modules/music/index.js';

import Event from '../../base/Event.js';
import logger from '../../../utils/logger.js';

export default class NowPlaying extends Event {
   constructor() {
      super({ name: 'nowPlaying' });
   }

   async execute(client: Bot, player: Player, track: Track) {
      if (!player.channel || !track.id) return;

      const color = await client.embed.color(track?.icon ?? '');

      const Embed = client.embed.new({
         color,
         author: {
            name: 'Now Playing!',
         },
         thumbnail: track?.icon ?? '',
         title: `${track.name.length > 36 ? `${track.name.slice(0, 36)}...` : track.name}`,
         description: `${track.artist.name}`,
      });

      try {
         const channel = await client.channels.fetch(player.channel);
         if (!channel?.isSendable()) return;

         await channel.send({
            embeds: [Embed],
            components: [],
         });
      } catch (error: any) {
         if (error.code == 10008) return;
         logger.error(error);
      }
   }
}
