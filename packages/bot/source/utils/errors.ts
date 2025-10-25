import { AutocompleteInteraction } from 'discord.js';
import type { InteractionContext } from '../loaders/Interactions.js';
import Player from '../player/Player.js';
import Radio from '../player/Radio.js';

type ErrorType = 'userNotInVoice' | 'botNotInVoice' | 'alreadyInVoice' | 'inSameVoice' | 'emptyQueue' | 'notPlaying' | 'isRadio';

const ErrorMessages: Record<ErrorType, string> = {
   userNotInVoice: 'You must join a voice channel first.',
   botNotInVoice: 'I must join a voice channel first.',
   alreadyInVoice: 'I am already connected to a voice channel.',
   inSameVoice: 'You need to be in the same voice channel as me.',
   notPlaying: 'The player is not currently playing any track.',
   emptyQueue: 'There are no tracks in the queue.',
   isRadio: 'You are connected to a radio, so this action is not available.',
};

type Interaction = InteractionContext | AutocompleteInteraction<'cached'>;

class Verify {
   private shouldRespond(interaction: Interaction, respond: boolean): interaction is InteractionContext {
      return !(interaction instanceof AutocompleteInteraction) && respond;
   }

   private handle(condition: boolean, interaction: Interaction, type: ErrorType, respond: boolean): boolean {
      if (!condition) return false;

      if (this.shouldRespond(interaction, respond)) {
         (interaction as InteractionContext).replyErro(ErrorMessages[type]);
      }

      return true;
   }

   isUserNotInVoice(interaction: Interaction, respond: boolean = true): boolean {
      const condition = !!interaction && !!interaction.member && !interaction.member.voice?.channel;
      return this.handle(condition, interaction, 'userNotInVoice', respond);
   }

   isBotNotInVoice(interaction: Interaction, respond: boolean = true): boolean {
      const condition = !interaction.guild?.members.me?.voice?.channel;
      return this.handle(condition, interaction, 'botNotInVoice', respond);
   }

   isAlreadyInVoice(interaction: Interaction, respond: boolean = true): boolean {
      const condition = !!interaction.guild?.members.me?.voice?.channel;
      return this.handle(condition, interaction, 'alreadyInVoice', respond);
   }

   isNotInSameVoice(interaction: Interaction, respond: boolean = true): boolean {
      const botChannel = interaction.guild?.members.me?.voice?.channel;
      const userChannel = interaction.member?.voice?.channel;
      const condition = !!botChannel && !!userChannel && botChannel.id !== userChannel.id;
      return this.handle(condition, interaction, 'inSameVoice', respond);
   }

   isNotPlaying(interaction: Interaction, player: Player, respond: boolean = true): boolean {
      const condition = !player.playing;
      return this.handle(condition, interaction, 'notPlaying', respond);
   }

   isEmptyQueue(interaction: Interaction, respond: boolean = true): boolean {
      if (interaction instanceof AutocompleteInteraction) return false;

      const condition = !interaction.queue?.tracks?.size;
      return this.handle(condition, interaction, 'emptyQueue', respond);
   }

   isRadio(interaction: Interaction, controller: Player | Radio, respond: boolean = true): controller is Radio {
      const condition = controller.isRadio();
      return this.handle(condition, interaction, 'isRadio', respond);
   }
}

export default Verify;
