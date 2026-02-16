import {
  ButtonStyle,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} from 'discord.js';
import { InteractionContext } from '../core/loaders/Interactions.js';

interface ButtonOptions {
  style?: ButtonStyle | keyof typeof ButtonStyle;
  label?: string;
  id?: string;
  url?: string;
  emoji?: string | { id?: string; name?: string; animated?: boolean };
  disabled?: boolean;
}

interface MenuOptions {
  id: string;
  placeholder?: string;
  options: Array<{
    label: string;
    description?: string;
    value: string;
    emoji?: string | { id?: string; name?: string; animated?: boolean };
    default?: boolean;
  }>;
}

interface PaginationOptions {
  interaction: InteractionContext;
  pages: EmbedBuilder[];
  type?: 'embeds' | 'content';
  style?: ButtonStyle | keyof typeof ButtonStyle;
}

export default class Buttons {
  new({
    style = 'Primary',
    label,
    id,
    url,
    emoji,
    disabled = false,
  }: ButtonOptions): ButtonBuilder {
    const button = new ButtonBuilder();

    if (id) button.setCustomId(id);
    if (label) button.setLabel(label);
    if (style === 'Link' && url) button.setURL(url);
    if (emoji) button.setEmoji(emoji);
    if (style) {
      if (typeof style === 'string') {
        const styleEnum = ButtonStyle[style];
        if (styleEnum !== undefined) button.setStyle(styleEnum);
        else button.setStyle(ButtonStyle.Primary); // Fallback
      } else {
        button.setStyle(style);
      }
    }

    button.setDisabled(disabled);
    return button;
  }

  row(components: ButtonBuilder[]) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents(components);
    return row;
  }

  menu({ id, placeholder, options }: MenuOptions) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(id)
      .setPlaceholder(placeholder ?? '')
      .addOptions(options);
    return menu;
  }

  async pagination({ interaction, pages, type = 'embeds', style = 'Primary' }: PaginationOptions) {
    if (!Array.isArray(pages)) throw new Error('Pages is not array!');
    if (!(type === 'embeds' || type === 'content')) throw new Error('Invalid type');

    if (pages.length <= 0) return;

    if (pages.length === 1) {
      await interaction.raw.reply({
        [type]: type === 'embeds' ? [pages[0]] : pages[0],
        fetchReply: true,
      });
      return;
    }

    let page = 0;

    const first = this.new({
      id: 'first',
      emoji: { id: '1070496991345377411', name: 'first' }, // Use object structure for emoji
      disabled: true,
      style,
    });
    const previous = this.new({
      id: 'previous',
      emoji: { id: '1070496467254513706', name: 'previous' },
      disabled: true,
      style,
    });
    const number = this.new({
      id: 'number',
      label: `${page + 1}/${pages.length}`,
      style: 'Secondary',
      disabled: true,
    });
    const next = this.new({
      id: 'next',
      emoji: { id: '1070496518420844566', name: 'next' },
      style,
    });
    const last = this.new({
      id: 'last',
      emoji: { id: '1070497040997568634', name: 'last' },
      style,
    });

    const buttons = [first, previous, number, next, last];
    const row = this.row(buttons);

    await interaction.raw.reply({
      [type]: type === 'embeds' ? [pages[page]] : pages[page],
      components: [row],
      fetchReply: true,
    });

    const message = await interaction.raw.fetchReply();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
    });

    collector.on('collect', (collect) => {
      void (async () => {
        if (!collect.isButton()) return;
        try {
          // eslint-disable-next-line @typescript-eslint/await-thenable
          await collect.deferUpdate(); // deferUpdate returns promise? Yes.
        } catch {
          // Ignore defer error
        }

        switch (collect.customId) {
          case 'first':
            page = 0;
            break;
          case 'previous':
            page = page === 0 ? 0 : page - 1;
            break;
          case 'next':
            page = page === pages.length - 1 ? page : page + 1;
            break;
          case 'last':
            page = pages.length - 1;
            break;
        }

        number.setLabel(`${page + 1}/${pages.length}`);

        first.setDisabled(page === 0);
        previous.setDisabled(page === 0);
        next.setDisabled(page === pages.length - 1);
        last.setDisabled(page === pages.length - 1);

        collector.resetTimer({ time: 30000 });

        try {
          await message.edit({
            [type]: type === 'embeds' ? [pages[page]] : pages[page],
            components: [row],
          });
        } catch {
          // ignore
        }
      })();
    });

    collector.on('end', () => {
      void (async () => {
        try {
          buttons.forEach((button) => {
            button.setDisabled(true);
            button.setStyle(ButtonStyle.Secondary);
          });
          const rowDisabled = this.row(buttons);
          await message.edit({
            [type]: type === 'embeds' ? [pages[page]] : pages[page],
            components: [rowDisabled],
          });
        } catch {
          // ignore
        }
      })();
    });
  }
}
