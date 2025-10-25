import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';

export default class Shuffle extends Interaction {
   constructor() {
      super({
         name: 'shuffle',
         description: 'Shuffle the queue!',
      });
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         const player = client.getGuildPlayback(context.guild.id);
         if (!player) return await context.replyErro('No player found for this guild!');

         if (client.verify.isRadio(context, player)) return;

         if (client.verify.isUserNotInVoice(context)) return;
         if (client.verify.isNotInSameVoice(context)) return;
         if (client.verify.isEmptyQueue(context)) return;

         player.queue.shuffle();
         return await context.raw.reply('Queue shuffled!');
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
