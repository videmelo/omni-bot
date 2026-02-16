import fs from 'node:fs';
import * as Discord from 'discord.js';
import Bot from '../Bot.js';
import logger from '../../utils/logger.js';

interface Interaction {
  name: string;
  description: string;
  commandName: string;
  id?: string;
  usage?: string;
  exemple?: string;
  execute: (params: { client: Bot; context: InteractionContext }) => Promise<void>;
  autocomplete: (params: {
    client: Bot;
    context: Discord.AutocompleteInteraction<'cached'>;
  }) => Promise<void>;
  toJSON: () => Discord.APIApplicationCommand;
}

interface InteractionConstructor {
  new (): Interaction;
}

export default class Interactions {
  client: Bot;
  items: Discord.Collection<string, Interaction>;
  constructor(client: Bot) {
    this.client = client;
    this.items = new Discord.Collection();
  }

  async load() {
    const folders = fs
      .readdirSync('./source/core/interactions')
      .filter((file) => fs.statSync(`./source/core/interactions/${file}`).isDirectory());
    try {
      logger.async('Started loading interactions:');
      await Promise.all(
        folders.map(async (folder) => {
          const files = fs
            .readdirSync(`./source/core/interactions/${folder}`)
            .filter((file) => file.endsWith('.ts'));
          await Promise.all(
            files.map(async (file) => {
              try {
                const module = (await import(`../interactions/${folder}/${file}`)) as {
                  default: InteractionConstructor;
                };
                const InteractionClass = module.default;
                const interaction = new InteractionClass();
                if (interaction.name && interaction.description) {
                  this.items.set(interaction.name, interaction);
                } else {
                  logger.warn(
                    `The interaction at ${file} is missing a required "name" or "description" property.`,
                  );
                }
              } catch (error: unknown) {
                logger.error(`${file} failed: ${String(error)}`, error);
              }
            }),
          );
        }),
      );
      logger.done(`Successfully loaded ${this.items.size} interactions.`);
      await this.deploy();
    } catch (error: unknown) {
      logger.error(`Error loading interactions.`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async deploy() {
    const rest = new Discord.REST({ version: '10' }).setToken(this.client.config.token);

    try {
      if (this.items.size == 0) {
        logger.error('Could not find any command');
        throw new Error('No commands found');
      }

      logger.async(`Started deploying interactions:`);
      const commands = this.items.map((interaction) => interaction.toJSON());
      const data = (await rest.put(Discord.Routes.applicationCommands(this.client.config.id), {
        body: commands,
      })) as Discord.APIApplicationCommand[];

      data.forEach((cmd) => {
        const item = this.items.get(cmd.name);
        if (item) item.id = cmd.id;
      });

      logger.done(`Successfully deployed ${data.length} interactions.`);
    } catch (error: unknown) {
      logger.error(`Error deploying interactions.`, error);
    }
  }

  async process(interaction: Discord.ChatInputCommandInteraction<'cached'>) {
    const context = new InteractionContext(this.client, interaction);
    if (interaction.isChatInputCommand()) {
      const command = this.items.get(interaction.commandName);
      if (!command) {
        logger.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        if (
          !interaction.appPermissions.has([
            Discord.PermissionFlagsBits.SendMessages,
            Discord.PermissionFlagsBits.ViewChannel,
          ])
        )
          throw new Error('No permissions!');
        await command.execute({ client: this.client, context });
      } catch (error: unknown) {
        logger.error(`Error executing ${interaction.commandName}:`, error);
        await context.replyErro(
          `What the f#@&! A very serious error occurred, try again later. \`\`\`${String(error)}\`\`\``,
        );
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
    return this.interaction.guild.members.cache.get(this.user.id);
  }

  get me() {
    return this.interaction.guild.members.me;
  }

  get queue() {
    return this.interaction.guild
      ? this.client.players.get(this.interaction.guild.id)?.queue
      : undefined;
  }

  get player() {
    return this.interaction.guild ? this.client.getGuildPlayback(this.interaction.guild.id) : null;
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
          // components: [], // flags cannot be used with editReply like reply flags?
          // editReply options don't have ephemeral flag, but editReply respects initial reply visibility.
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
      else
        logger.error(
          `Failed to send error message in ${this.interaction.guild.name}#${this.interaction.channel?.name}`,
        );
    }
  }
}
