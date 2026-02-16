import type Bot from '../Bot.js';
import { SlashCommandBuilder } from 'discord.js';

// Extend SlashCommandBuilder to inherit methods like addStringOption, setName, etc.
export default class Interaction extends SlashCommandBuilder {
  public commandName: string;
  public dm: boolean;
  public usage?: string;
  public exemple?: string;
  public id?: string;

  constructor({
    name = '',
    description = '',
    commandName = '',
    dm = false,
    usage = '',
    exemple = '',
  }: {
    name?: string;
    description?: string;
    commandName?: string;
    dm?: boolean;
    usage?: string;
    exemple?: string;
  } = {}) {
    super();
    if (name) this.setName(name);
    if (description) this.setDescription(description);
    this.commandName = commandName || name;
    this.dm = dm;
    this.usage = usage;
    this.exemple = exemple;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async execute({ client, context }: { client: Bot; context: any }): Promise<any> {
    // Override me
  }
}
