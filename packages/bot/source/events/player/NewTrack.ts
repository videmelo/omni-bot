import Bot from '../../core/Bot.js';
import { Track } from '../../models/Track.js';
import Queue from '../../player/Queue.js';

import Event from '../../base/Event.js';
import Player from '../../player/Player.js';
import { TextBasedChannel, TextChannel } from 'discord.js';

export default class NewTrack extends Event {
   constructor() {
      super({ name: 'newTrack' });
   }

   async execute(client: Bot, player: Player, track: Track) {
      if (!player.channel || !track.id) return;

      const Embed = client.embed.new({
         description: `Added  **[${track.name}](${track.url})** by **[${track.artist.name}](${track.artist.url})** to queue`,
      });

      const channel = await client.channels.fetch(player.channel);
      if (!channel?.isSendable()) return;

      await channel.send({
         embeds: [Embed],
      });
   }
}
