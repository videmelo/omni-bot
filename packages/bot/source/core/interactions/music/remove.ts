import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';

export default class Remove extends Interaction {
  constructor() {
    super({
      name: 'remove',
      description: 'Remove a track from the queue!',
      exemple: '1',
      usage: '<index>',
    });

    this.addIntegerOption((option) =>
      option.setName('index').setDescription('Index of the track to remove').setRequired(true),
    );
  }

  async execute({ client, context }: { client: Bot; context: InteractionContext }) {
    try {
      const player = client.getGuildPlayback(context.guild.id);
      if (!player) return await context.replyErro('No player found for this guild!');

      if (client.verify.isRadio(context)) return;
      if (client.verify.isUserNotInVoice(context)) return;
      if (client.verify.isNotInSameVoice(context)) return;
      if (client.verify.isEmptyQueue(context)) return;

      const index = context.raw.options.getInteger('index');

      if (index! > player.queue.tracks.size)
        return await context.replyErro("You can't remove a track that hasn't been added yet.");

      const track = player.queue.remove(index!);
      if (track) return await context.raw.reply(`Removed \`${track.name}\` from the queue.`);
      return await context.replyErro('No track found at this index.');
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}
