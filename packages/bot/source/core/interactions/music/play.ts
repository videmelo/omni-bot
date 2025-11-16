import Bot from '../../Bot.js';
import { InteractionContext } from '../../loaders/Interactions.js';
import Interaction from '../../base/Interaction.js';
import { AutocompleteInteraction } from 'discord.js';

export default class Play extends Interaction {
   constructor() {
      super({
         name: 'play',
         description: 'Start play a music!',
         exemple: 'Travis Scott',
         usage: '[input]',
      });

      this.addStringOption((option) => option.setName('input').setDescription('Search a music name!').setRequired(true).setAutocomplete(true));
   }

   async autocomplete({ client, context }: { client: Bot; context: AutocompleteInteraction<'cached'> }) {
      try {
         if (client.verify.isNotInSameVoice(context) || client.verify.isUserNotInVoice(context)) {
            return await context.respond([{ name: `Please join in voice channel to play music!`, value: `403` }]);
         }

         const focused = context.options.getFocused();
         if (!focused) return await context.respond([]);

         const search = await client.search.resolve(focused);
         if (!search?.items.tracks) return await context.respond([]);
         const tracks = search.items.tracks.map((track: any) => {
            const { artist, name } = track;
            const item = `${name} - ${artist.name}`.length > 100 ? `${name.slice(0, 100 - artist.name.length - 6)}... - ${artist.name}` : `${name} - ${artist.name}`;
            return { name: item, value: item };
         });

         await context.respond(tracks);
      } catch (error: any) {
         throw new Error(error);
      }
   }

   async execute({ client, context }: { client: Bot; context: InteractionContext }) {
      try {
         if (client.verify.isUserNotInVoice(context) || client.verify.isNotInSameVoice(context)) return;

         const input = context.raw.options.getString('input', true);

         if (!input) return;

         await context.raw.deferReply();

         let player = client.getGuildPlayback(context.guild.id);
         if (player) if (client.verify.isRadio(context, player)) return;

         if (!player) player = await client.players.set(context.member!.voice.channel!, context.channel!);
         if (!player) {
            return await context.replyErro('An error occurred while initializing the guild player!');
         }
         if (!player.channel) player.setTextChannel(context.channel!.id);

         console.log(`Searching for: ${input}`);
         const search = await client.search.resolve(input);
         switch (search?.type) {
            case 'track': {
               if (!search?.items.tracks) return await context.replyErro('No tracks found.');

               const track = await player.play(search.items.tracks[0]).catch(() => {
                  context.replyErro('An error occurred while playing the track!');
               });
               if (!track) return await context.replyErro('An error occurred while playing the track! Try latter.');
               break;
            }
            case 'playlist': {
               if (!search.items.playlists!.length) return context.replyErro('This Playlist is empty!');
               let track = player.queue.new(search.items.playlists![0]);
               if (!track) return await context.replyErro('An error occurred while adding playlist to queue!');
               let played = await player.play(track).catch(() => {
                  context.replyErro('An error occurred while playing the track!');
               });
               if (!played) return await context.replyErro('An error occurred while playing the track! Try latter.');
               break;
            }
         }

         return await context.noReply();
      } catch (error: any) {
         throw new Error(error);
      }
   }
}
