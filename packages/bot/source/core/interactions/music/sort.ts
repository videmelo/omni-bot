import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';

export default class Sort extends Interaction {
  constructor() {
    super({
      name: 'sort',
      description: 'Sort the queue!',
    });
  }

  async execute({ client, context }: { client: Bot; context: InteractionContext }) {
    try {
      const player = client.getGuildPlayback(context.guild.id);
      if (!player) return await context.replyErro('No player found for this guild!');

      if (client.verify.isRadio(context)) return;
      if (client.verify.isUserNotInVoice(context)) return;
      if (client.verify.isNotInSameVoice(context)) return;
      if (client.verify.isEmptyQueue(context)) return;

      player.queue.reorder();
      return await context.raw.reply('Queue sorted!');
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}
