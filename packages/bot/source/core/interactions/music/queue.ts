import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';

class Queue extends Interaction {
  constructor() {
    super({
      name: 'queue',
      description: 'Guild Queue.',
    });
  }

  async execute({ client, context }: { client: Bot; context: InteractionContext }) {
    try {
      const player = client.getGuildPlayback(context.guild.id);
      if (!player) return await context.replyErro('No player found for this guild!');

      const queue = player.queue;

      const tracks = queue.tracks.map((track) => {
        return `> **${track.index! + 1}.** ${track.name}\n> \`${track.artist.name}\``;
      });

      const pages = client.embed.pages(tracks);
      const current = queue.tracks.find((track) => track.id === player.current?.id)!;
      if (!current) return context.replyErro('No current playing song found!');

      const next = queue.next();
      const color = await client.embed.color(current.icon!);
      const embeds = pages.map((track, index) => {
        return client.embed.new({
          thumbnail: `${current.icon}`,
          color,
          fields: [
            {
              name: 'Current',
              value: `**${current.index! + 1}.** ${current.name}\n\`${current.artist.name}\``,
              inline: true,
            },
            {
              name: 'Next',
              value: next
                ? `**${next.index! + 1}.** ${next.name}\n\`${next.artist.name}\``
                : 'No more tracks in the queue.',
              inline: true,
            },
            {
              name: 'List',
              value: pages[index],
            },
          ],
          footer: {
            text: `Queue  •  ${queue.tracks.size} tracks`,
          },
        });
      });

      await client.button.pagination({
        interaction: context,
        pages: embeds,
      });
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}

module.exports = Queue;
