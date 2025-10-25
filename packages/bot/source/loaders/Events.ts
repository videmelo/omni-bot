import Bot from '../core/Bot.js';
import { Collection } from 'discord.js';
import fs from 'node:fs';
import logger from '../utils/logger.js';

export default class Events {
   client: Bot;
   list: Array<{ name: string; handler: (...args: any[]) => void }> = [];
   constructor(client: Bot) {
      this.client = client;
      this.list = [];
   }

   async load() {
      const folders = fs
         .readdirSync('./source/events')
         .filter((file) => fs.statSync(`./source/events/${file}`).isDirectory());
      try {
         logger.async('Started loading events:');
         let length = 0;

         
         await Promise.all(
            folders.map(async (folder) => {
               const files = fs
                  .readdirSync(`./source/events/${folder}`)
                  .filter((file) => file.endsWith('.ts'));
               await Promise.all(
                  files.map(async (file) => {
                     try {
                        const { default: Event } = await import(`../events/${folder}/${file}`);
                        const event = new Event();
                        if (folder === 'client') {
                           this.client.on(event.name, (...args: any[]) =>
                              event.execute(this.client, ...args)
                           );
                        } else if (folder === 'player') {
                           const handler = (...args: any[]) => {
                              event.execute(this.client, ...args)
                           };
                           this.list.push({
                              name: event.name,
                              handler,
                           });
                        }
                        length++;
                     } catch (error: any) {
                        logger.error(`${file} failed: ${error}`, error);
                     }
                  })
               );
            })
         );

         const player = this.client.players.set.bind(this.client.players);
         this.client.players.set = (key, event) => {
            const result = player(key, event);
            this.list.forEach(({ name, handler }) => {
               event.on(name, handler);
            });
            return result;
         };

         logger.done(`Successfully loaded ${length} events.`);
      } catch (error: any) {
         logger.error('Error loading events.', error);
         throw new Error(error);
      }
   }
}
