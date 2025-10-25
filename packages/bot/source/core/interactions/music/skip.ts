import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';

export default class Skip extends Interaction {
   constructor() {
      super({
         name: 'skip',
         description: 'Skip to a next track.',
         exemple: '4',
         usage: '[to]',
      });

      this.addIntegerOption((option) => option.setName('to').setDescription('Skip to a track'));
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         const player = client.getGuildPlayback(context.guild.id);
         if (!player) return await context.replyErro('No player found for this guild!');

         if (client.verify.isRadio(context, player)) return;

         if (client.verify.isUserNotInVoice(context)) return;
         if (client.verify.isNotInSameVoice(context)) return;
         if (client.verify.isEmptyQueue(context)) return;

         let index = context.raw.options.getInteger('to');
         if (index! > player.queue.tracks.size) return await context.replyErro("You can't skip to a track that hasn't been added yet.");

         if (index) {
            const track = player.queue.get(index);
            if (!track) return await context.replyErro('No track found at this index.');
            await player.play(track);
         } else {
            const next = player.queue.next();
            if (!next) return await context.replyErro('No next track found in the queue.');
            await player.play(next, { force: true });
         }
         return await context.raw.reply('Skipped');
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
