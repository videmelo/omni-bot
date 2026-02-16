import Bot from '../Bot.js';

interface EventOptions {
  name?: string;
}

export default class Event {
  public name: string;

  constructor({ name = '' }: EventOptions = {}) {
    this.name = name;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(client: Bot, ...args: unknown[]): Promise<void> {
    // Override
  }
}
