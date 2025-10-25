import fs from 'node:fs';
import * as Discord from 'discord.js';
import Bot from '../core/Bot.js';
import logger from '../utils/logger.js';
import Embed from '../utils/embed.js';
import Interaction from '../base/Interaction.js';

export default class Interactions {
   client: Bot;
   items: Discord.Collection<string, any>;
   constructor(client: Bot) {
      this.client = client;
      this.items = new Discord.Collection();
   }

   async load() {
      const folders = fs.readdirSync('./source/interactions').filter((file) => fs.statSync(`./source/interactions/${file}`).isDirectory());
      try {
         logger.async('Started loading interactions:');
         await Promise.all(
            folders.map(async (folder) => {
               const files = fs.readdirSync(`./source/interactions/${folder}`).filter((file) => file.endsWith('.ts'));
               await Promise.all(
                  files.map(async (file) => {
                     try {
                        const { default: Interaction } = await import(`../interactions/${folder}/${file}`);
                        const interaction = new Interaction();
                        if (interaction.name && interaction.description) {
                           this.items.set(interaction.name, interaction);
                           // logger.info(`${file} working`);
                        } else {
                           logger.warn(`The interaction at ${file} is missing a required "name" or "descripition" property.`);
                        }
                     } catch (error: any) {
                        logger.error(`${file} failed: ${error}`, error);
                     }
                  })
               );
            })
         );
         logger.done(`Successfully loaded ${this.items.size} interactions.`);
         this.deploy();
      } catch (error: any) {
         logger.error(`Error loading interactions.`, error);
         throw new Error(error);
      }
   }

   async deploy() {
      const rest = new Discord.REST({ version: '10' }).setToken(this.client.config.token);

      try {
         if (this.items.size == 0) {
            logger.error('Could not find any command');
            throw new Error();
         }

         logger.async(`Started deploying interactions:`);
         const commands = this.items.map((interaction) => interaction.toJSON());
         const data = (await rest.put(Discord.Routes.applicationCommands(this.client.config.id), {
            body: commands,
         })) as Discord.APIApplicationCommand[];

         data.map((interaction) => {
            const command = this.items.get(interaction.name);
            this.items.set(interaction.name, {
               ...interaction,
               ...command,
               execute: command.execute,
               autocomplete: command.autocomplete,
            });
         });

         logger.done(`Successfully deployed ${data.length} interactions.`);
      } catch (error: any) {
         logger.error(`Error deploying interactions.`, error);
      }
   }

   async process(interaction: Discord.ChatInputCommandInteraction<'cached'>) {
      const context = new InteractionContext(this.client, interaction);
      if (interaction.isChatInputCommand()) {
         const command = this.items.get(interaction.commandName) as Interaction;
         if (!command) {
            logger.error(`No command matching ${interaction.commandName} was found.`);
            return;
         }

         try {
            if (!interaction.appPermissions.has([Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.ViewChannel])) throw new Error('No prmissions!');
            await command.execute({ client: this.client, context });
         } catch (error: any) {
            logger.error(`Error executing ${interaction.commandName}:`, error);
            await context.replyErro(`What the f#@&! A very serious error occurred, try again later. \`\`\`${error}\`\`\``);
         }
      }
   }
}

export class InteractionContext {
   client: Bot;
   interaction: Discord.ChatInputCommandInteraction<'cached'>;

   constructor(client: Bot, interaction: Discord.ChatInputCommandInteraction<'cached'>) {
      this.client = client;
      this.interaction = interaction;
   }

   get(prop: keyof Discord.ChatInputCommandInteraction<'cached'>) {
      return this.interaction[prop];
   }

   get user() {
      return this.interaction.user;
   }

   get channel() {
      return this.interaction.channel;
   }

   get guild() {
      return this.interaction.guild;
   }

   get member() {
      return this.interaction.guild.members.cache.get(this.user?.id);
   }

   get me() {
      return this.interaction.guild.members.me;
   }

   get queue() {
      return this.interaction.guild ? this.client.players.get(this.interaction.guild.id)?.queue : undefined;
   }

   get raw() {
      return this.interaction;
   }

   async noReply() {
      if (this.interaction.deferred) return await this.interaction.deleteReply();
      await this.interaction.deferReply();
      await this.interaction.deleteReply();
   }

   async replyErro(message: string) {
      const embed = this.client.embed.new({
         description: message,
         color: '#BA3737',
      });

      try {
         if (this.interaction.replied || this.interaction.deferred)
            await this.interaction.editReply({
               embeds: [embed],
               flags: 1 << 6,
            });
         else
            await this.interaction.reply({
               embeds: [embed],
               flags: Discord.MessageFlags.Ephemeral,
            });
      } catch {
         if (this.interaction.channel?.isTextBased())
            await this.interaction.channel.send({
               embeds: [embed],
            });
         else logger.error(`Failed to send error message in ${this.interaction.guild?.name}#${this.interaction.channel?.name}`);
      }
   }
}
