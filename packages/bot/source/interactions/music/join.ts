import Bot from '../../core/Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';
import logger from '../../utils/logger.js';

export default class Join extends Interaction {
   constructor() {
      super({
         name: 'join',
         description: 'Join to a voice channel!',
      });
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         if (client.verify.isUserNotInVoice(context)) return;

         const player = client.getGuildPlayback(context.guild.id);
         if (player) if (client.verify.isRadio(context, player)) return;

         context.noReply();
         client.initGuildPlayer(context.member!.voice.channel!, context.channel!);
      } catch (err: any) {
         throw new Error(err);
      }
   }
}
