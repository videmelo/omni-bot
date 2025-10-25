import { AutocompleteInteraction, BaseInteraction, ChatInputCommandInteraction } from 'discord.js';
import Bot from '../../core/Bot.js';

import Event from '../../base/Event.js';
import logger from '../../utils/logger.js';

export default class InteractionCreate extends Event {
   constructor() {
      super({ name: 'interactionCreate' });
   }

   async execute(client: Bot, interaction: ChatInputCommandInteraction<'cached'> | AutocompleteInteraction) {
      if (interaction.isChatInputCommand()) {
         client.interactions.process(interaction);
      }

      if (interaction.isAutocomplete()) {
         const command = client.interactions.items.get(interaction.commandName);
         if (!command) {
            logger.error(`No command matching ${interaction.commandName} was found.`);
            return;
         }

         try {
            await command.autocomplete({ client, context: interaction });
         } catch (error: any) {
            logger.error(`Error executing ${interaction.commandName}`, error);
            return;
         }
      }
   }
}
