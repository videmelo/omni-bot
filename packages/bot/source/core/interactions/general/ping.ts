import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';

export default class Ping extends Interaction {
  constructor() {
    super({
      name: 'ping',
      description: 'Sends Pong!',
    });
  }

  async execute({ client, context }: { client: Bot; context: InteractionContext }) {
    await context.raw.reply(
      `**Pong!** 🏓 \nLatency is ${Date.now() - context.raw.createdTimestamp}ms.\nAPI Latency is ${Math.round(client.ws.ping)}ms`,
    );
  }
}
