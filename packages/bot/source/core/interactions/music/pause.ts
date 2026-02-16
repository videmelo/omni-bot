import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';
import { Player } from '../../../modules/music/Player.js';

export default class pause extends Interaction {
  constructor() {
    super({
      name: 'pause',
      description: 'Pause current track!',
    });
  }

  async execute({ client, context }: { client: Bot; context: InteractionContext }) {
    try {
      const player = client.getGuildPlayback(context.guild.id);
      if (!player) return await context.replyErro('No player found for this guild!');

      if (client.verify.isUserNotInVoice(context)) return;
      if (client.verify.isRadio(context)) return;
      if (client.verify.isNotInSameVoice(context)) return;
      if (client.verify.isNotPlaying(context)) return;
      if (client.verify.isEmptyQueue(context)) return;

      (player as Player).pause();
      await context.noReply();
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}
