import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';
import { VoiceBasedChannel } from 'discord.js';

export default class Broadcast extends Interaction {
   constructor() {
      super({
         name: 'broadcast',
         description: 'Execute a command in large scale for tests!',
      });

      this.addStringOption((option) => option.setName('input').setDescription('Input for a command!').setRequired(true));
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      const voices = [
         '1343352947320553523',
         '1343352599398580248',
         '1343345916224081956',
         '1343345399489888414',
         '1343062286587138082',
         '1343060393374912597',
         '1343059910803456093',
         '1343061169761423433',
         '1343058313675411477',
      ];

      const input = context.raw.options.getString('input')!;
      const search = await client.search.resolve(input);
      if (!search || !search.items.tracks || search.items.tracks?.length === 0) {
         return await context.replyErro('No results found for the provided input!');
      }

      const players = [];

      for (const voice of voices) {
         const channel = (await client.channels.cache.get(voice)) as VoiceBasedChannel;
         const player = await client.initGuildPlayer(channel);
         if (!player) return await context.replyErro('Failed to initialize player for broadcast!');
         player.queue.new(search.items.tracks[0]);
         player.queue.shuffle();
         players.push(player);
      }

      for (const player of players) {
         if (player.queue.tracks.size === 0) {
            return await context.replyErro('No tracks in the queue for the player!');
         }
         await player.play(player.queue.tracks.at(0)!);
      }
   }
}
