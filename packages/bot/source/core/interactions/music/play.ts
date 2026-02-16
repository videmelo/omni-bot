import Interaction from '../../base/Interaction.js';
import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import { Player } from '../../../modules/music/Player.js';
import { AutocompleteInteraction } from 'discord.js';

export default class Play extends Interaction {
  constructor() {
    super({
      name: 'play',
      description: 'Start play a music!',
      exemple: 'Travis Scott',
      usage: '[input]',
    });

    this.addStringOption((option) =>
      option
        .setName('input')
        .setDescription('Search a music name!')
        .setRequired(true)
        .setAutocomplete(true),
    );
  }

  async autocomplete({
    client,
    context,
  }: {
    client: Bot;
    context: AutocompleteInteraction<'cached'>;
  }) {
    try {
      if (client.verify.isUserNotInVoice(context) || client.verify.isNotInSameVoice(context)) {
        return await context.respond([
          { name: `Please join in voice channel to play music!`, value: `403` },
        ]);
      }

      const focused = context.options.getFocused();
      if (!focused) return await context.respond([]);

      const search = await client.search.resolve(focused);
      if (!search?.items.tracks) return await context.respond([]);
      const tracks = search.items.tracks.map((track) => {
        const { artist, name } = track;
        const item =
          `${name} - ${artist.name}`.length > 100
            ? `${name.slice(0, 100 - artist.name.length - 6)}... - ${artist.name}`
            : `${name} - ${artist.name}`;
        return { name: item, value: item };
      });

      await context.respond(tracks);
    } catch (error) {
      throw new Error(String(error));
    }
  }

  async execute({ client, context }: { client: Bot; context: InteractionContext }) {
    try {
      const playback = client.getGuildPlayback(context.guild.id);

      if (client.verify.isUserNotInVoice(context)) return;
      if (client.verify.isNotInSameVoice(context)) return;

      const input = context.raw.options.getString('input', true);
      if (!input) return;

      await context.raw.deferReply();

      if (playback?.isRadio()) {
        return await context.replyErro(
          'You are connected to a radio, so this action is not available.',
        );
      }

      let player: Player;
      if (!playback) {
        const manager = await client.players.set(context.member!.voice.channel!, context.channel!);
        if (!manager) {
          return await context.replyErro('An error occurred while initializing the guild player!');
        }
        player = manager;
      } else {
        player = playback as Player;
      }

      if (!player.channel) player.setTextChannel(context.channel!.id);


      const search = await client.search.resolve(input);
      switch (search?.type) {
        case 'track': {
          if (!search?.items.tracks) return await context.replyErro('No tracks found.');

          const track = await player.play(search.items.tracks[0]).catch(() => {
            void context.replyErro('An error occurred while playing the track!');
          });
          if (!track)
            return await context.replyErro('An error occurred while playing the track! Try later.');
          break;
        }
        case 'playlist': {
          if (!search.items.playlists!.length) return context.replyErro('This Playlist is empty!');
          const track = player.queue.new(search.items.playlists![0]);
          if (!track)
            return await context.replyErro('An error occurred while adding playlist to queue!');
          const played = await player.play(track).catch(() => {
            void context.replyErro('An error occurred while playing the track!');
          });
          if (!played)
            return await context.replyErro('An error occurred while playing the track! Try later.');
          break;
        }
      }

      return await context.noReply();
    } catch (error) {
      throw new Error(String(error));
    }
  }
}
