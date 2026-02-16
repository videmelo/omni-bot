import { AutocompleteInteraction } from 'discord.js';
import type { InteractionContext } from '../core/loaders/Interactions.js';
import type Bot from '../core/Bot.js';

import { Player, Radio } from '../modules/music/index.js';

type ErrorType =
  | 'userNotInVoice'
  | 'botNotInVoice'
  | 'alreadyInVoice'
  | 'inSameVoice'
  | 'emptyQueue'
  | 'notPlaying'
  | 'isRadio';

const ErrorMessages: Record<ErrorType, string> = {
  userNotInVoice: 'You must join a voice channel first.',
  botNotInVoice: 'I must join a voice channel first.',
  alreadyInVoice: 'I am already connected to a voice channel.',
  inSameVoice: 'You need to be in the same voice channel as me.',
  notPlaying: 'The player is not currently playing any track.',
  emptyQueue: 'There are no tracks in the queue.',
  isRadio: 'You are connected to a radio, so this action is not available.',
};

type Context = InteractionContext | AutocompleteInteraction<'cached'>;

class Verify {
  private shouldRespond(context: Context, respond: boolean): context is InteractionContext {
    return !(context instanceof AutocompleteInteraction) && respond;
  }

  private handle(condition: boolean, context: Context, type: ErrorType, respond: boolean): boolean {
    if (!condition) return false;

    if (this.shouldRespond(context, respond)) {
      void (context).replyErro(ErrorMessages[type]);
    }

    return true;
  }

  private getPlayer(context: Context): Player | Radio | null {
    if ('player' in context) {
      return (context).player;
    }
    const client = context.client as unknown as Bot;
    const guildId = context.guild?.id;
    return guildId ? client.getGuildPlayback(guildId) : null;
  }

  isUserNotInVoice(context: Context, respond: boolean = true): boolean {
    const interaction = context as InteractionContext;
    const condition = !!interaction && !!interaction.member && !interaction.member.voice?.channel;
    return this.handle(condition, context, 'userNotInVoice', respond);
  }

  isBotNotInVoice(context: Context, respond: boolean = true): boolean {
    const interaction = context as InteractionContext;
    const condition = !interaction.guild?.members.me?.voice?.channel;
    return this.handle(condition, context, 'botNotInVoice', respond);
  }

  isAlreadyInVoice(context: Context, respond: boolean = true): boolean {
    const interaction = context as InteractionContext;
    const condition = !!interaction.guild?.members.me?.voice?.channel;
    return this.handle(condition, context, 'alreadyInVoice', respond);
  }

  isNotInSameVoice(context: Context, respond: boolean = true): boolean {
    let condition = false;

    const interaction = context as InteractionContext;
    const botChannel = interaction.guild?.members.me?.voice?.channel;
    const userChannel = interaction.member?.voice?.channel;

    const player = this.getPlayer(context);

    if (player) {
      if (player.isRadio()) {
        condition = !player.connections.has(interaction.guild.id);
      } else {
        condition = !!player.voice && !!userChannel && player.voice !== userChannel.id;
      }
    } else {
      condition = !!botChannel && !!userChannel && botChannel.id !== userChannel.id;
    }
    return this.handle(condition, context, 'inSameVoice', respond);
  }

  isNotPlaying(context: Context, respond: boolean = true): boolean {
    const player = this.getPlayer(context);
    const condition = !player || !player.playing;
    return this.handle(condition, context, 'notPlaying', respond);
  }

  isEmptyQueue(context: Context, respond: boolean = true): boolean {
    if (context instanceof AutocompleteInteraction) return false;

    const player = this.getPlayer(context);
    const condition = !player || !player.queue.tracks.size;
    return this.handle(condition, context, 'emptyQueue', respond);
  }

  isRadio(context: Context, respond: boolean = true): boolean {
    const player = this.getPlayer(context);
    const condition = !!player && player.isRadio();
    return this.handle(condition, context, 'isRadio', respond);
  }
}

export default Verify;
