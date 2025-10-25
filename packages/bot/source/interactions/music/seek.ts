import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';

export default class Seek extends Interaction {
   constructor() {
      super({
         name: 'seek',
         description: 'Seek to a position in the track!',
         exemple: '1:30',
         usage: '<position>',
      });

      this.addStringOption((option) => option.setName('position').setDescription('Position to seek').setRequired(true));
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

         const position = context.raw.options.getString('position')!;

         const regex = /^(((\d+):)?(\d{1,2})?(:(\d{2}))|((\d+)h)?\s?((\d+)m)?\s?((\d+)s)?)$/;
         const matches = regex.exec(position);
         if (!matches) return await context.replyErro('Invalid position format. Valid formats: `1:30`, `1m30s`, `90s`, `90`.');

         const hours = matches[3] || matches[8] || '0';
         const minutes = matches[4] || matches[10] || '0';
         const seconds = matches[6] || matches[12] || '0';
         const time = parseInt(hours) * 3600000 + parseInt(minutes) * 60000 + parseInt(seconds) * 1000;

         if (time > player.current!.metadata!.duration) return await context.replyErro('Position cannot be longer than the track duration.');

         await player.seek(time / 1000);
         return await context.raw.reply(`Seeked to \`${position}\`.`);
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
