import { AutocompleteInteraction } from 'discord.js';
import Bot from '../../core/Bot.js';
import Interaction from '../../base/Interaction.js';
import { InteractionContext } from '../../loaders/Interactions.js';

export default class Radio extends Interaction {
   constructor() {
      super({
         name: 'radio',
         description: 'join in a radio',
      });

      this.addStringOption((option) => option.setName('radio').setDescription('A Radio').setRequired(true).setAutocomplete(true));
   }

   async autocomplete({ client, context }: { client: Bot; context: AutocompleteInteraction<'cached'> }) {
      try {
         if (client.verify.isNotInSameVoice(context) || client.verify.isUserNotInVoice(context)) {
            return await context.respond([{ name: `Please join in voice channel to play music!`, value: `403` }]);
         }

         const radios = [...client.radios.values()];
         if (!radios) context.respond([]);

         const radio = context.options.get('radio');

         if (radio?.focused) {
            const sessions = radios
               .map((radio) => {
                  return { name: radio.name, value: radio.id };
               })
               .slice(0, 25);
            if (!sessions) return await context.respond([]);
            return await context.respond(sessions);
         }
      } catch (error: any) {
         throw new Error(error);
      }
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      if (client.verify.isUserNotInVoice(context) || client.verify.isNotInSameVoice(context)) return;
      const session = context.raw.options.get('radio', true)!;
      const radio = client.radios.get(String(session.value));

      if (!radio) return await context.replyErro('Radio not found!!');

      radio?.connect(context.guild.id, context.member!.voice.channel!.id);
   }
}
