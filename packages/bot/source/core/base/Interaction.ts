import Bot from '../Bot.js';
import { SlashCommandBuilder } from 'discord.js';
import Logger from '../../utils/logger.js';

interface InteractionOptions {
   name: string;
   description: string;
   exemple?: string;
   usage?: string;
}

export default class Interaction extends SlashCommandBuilder {
   help: { exemple?: string; usage?: string };
   constructor({ name, description, exemple, usage }: InteractionOptions) {
      super();

      this.setName(name);
      this.setDescription(description);

      this.help = { exemple, usage };
   }

   autocomplete(context: any) {
      Logger.error(`${this.name}.js - An 'autocomplete' method is required`);
      throw new Error();
   }

   execute(context: any) {
      Logger.error(`${this.name}.js - An 'execute' method is required`);
      throw new Error();
   }
}
