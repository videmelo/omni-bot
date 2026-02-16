import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';

export default class Join extends Interaction {
  constructor() {
    super({
      name: 'join',
      description: 'Join to a voice channel!',
    });
  }

  async execute({ client, context }: { client: Bot; context: InteractionContext }) {
    try {
      const player = client.getGuildPlayback(context.guild.id);

      if (client.verify.isUserNotInVoice(context)) return;

      // Se já existe e é radio, bloqueia
      if (player && player.isRadio()) {
        return await context.replyErro(
          'You are connected to a radio, so this action is not available.',
        );
      }

      await context.noReply();
      await client.players.set(context.member!.voice.channel!, context.channel!);
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}
