import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';

export default class Loop extends Interaction {
   constructor() {
      super({
         name: 'loop',
         description: 'Loop the queue or current track!',
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
         if (client.verify.isNotPlaying(context, player)) return;

         player.queue.setRepeat(player.queue.repeat == 'off' ? 'queue' : player.queue.repeat == 'queue' ? 'track' : 'off');

         if (player.queue.repeat == 'off') {
            await context.raw.reply('Loop disabled!');
         } else if (player.queue.repeat == 'queue') {
            await context.raw.reply('Loop player enabled!');
         } else if (player.queue.repeat == 'track') {
            await context.raw.reply('Loop current track enabled!');
         }
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
