import Bot from '../Bot.js';
import fs from 'node:fs';
import logger from '../../utils/logger.js';

interface Event {
  name: string;
  execute: (client: Bot, ...args: unknown[]) => void;
}

interface EventConstructor {
  new (): Event;
}

export default class Events {
  client: Bot;
  list: Array<{ name: string; handler: (...args: unknown[]) => void }> = [];
  constructor(client: Bot) {
    this.client = client;
    this.list = [];
  }

  async load() {
    const folders = fs
      .readdirSync('./source/core/events')
      .filter((file) => fs.statSync(`./source/core/events/${file}`).isDirectory());
    try {
      logger.async('Started loading events:');
      let length = 0;

      await Promise.all(
        folders.map(async (folder) => {
          const files = fs
            .readdirSync(`./source/core/events/${folder}`)
            .filter((file) => file.endsWith('.ts'));
          await Promise.all(
            files.map(async (file) => {
              try {
                const module = (await import(`../events/${folder}/${file}`)) as {
                  default: EventConstructor;
                };
                const EventClass = module.default;
                const event = new EventClass();
                if (folder === 'client') {
                  this.client.on(event.name, (...args: unknown[]) =>
                    event.execute(this.client, ...args),
                  );
                } else if (folder === 'player') {
                  const handler = (...args: unknown[]) => {
                    event.execute(this.client, ...args);
                  };
                  this.list.push({
                    name: event.name,
                    handler,
                  });
                }
                length++;
              } catch (error: unknown) {
                logger.error(`${file} failed: ${String(error)}`, error);
              }
            }),
          );
        }),
      );

      const player = this.client.players.list.set.bind(this.client.players.list);
      this.client.players.list.set = (key, event) => {
        const result = player(key, event);
        this.list.forEach(({ name, handler }) => {
          event.on(name, handler);
        });
        return result;
      };

      logger.done(`Successfully loaded ${length} events.`);
    } catch (error: unknown) {
      logger.error('Error loading events.', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}
