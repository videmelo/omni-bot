import { EmbedBuilder, APIEmbedField, EmbedAuthorOptions, EmbedFooterOptions } from 'discord.js';
import Vibrant from 'node-vibrant';

interface EmbedOptions {
  title?: string;
  description?: string;
  fields?: APIEmbedField[];
  thumbnail?: string;
  color?: string;
  timestamp?: boolean;
  author?: EmbedAuthorOptions;
  footer?: EmbedFooterOptions;
}

export default class Embed {
  public new({
    title = '',
    description = '',
    fields = [],
    thumbnail = '',
    color = '#91D7E0',
    timestamp = false,
    author,
    footer,
  }: EmbedOptions): EmbedBuilder {
    const embed = new EmbedBuilder();

    embed.setColor(Number(color.replace('#', '0x')));

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (fields.length > 0) embed.addFields(fields);
    if (timestamp) embed.setTimestamp();
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (author) embed.setAuthor(author);
    if (footer) embed.setFooter(footer);

    return embed;
  }

  public pages(list: string[], size = 10): string[] {
    const pages: string[] = [];
    for (let i = 0; i < list.length; i += size) {
      pages.push(list.slice(i, i + size).join('\n\n'));
    }
    return pages;
  }

  public async color(
    image: string,
    type:
      | 'Vibrant'
      | 'Muted'
      | 'DarkVibrant'
      | 'DarkMuted'
      | 'LightVibrant'
      | 'LightMuted' = 'Vibrant',
  ): Promise<string> {
    const swatches = await Vibrant.from(image).getSwatches();
    return swatches?.[type]?.hex ?? '#91D7E0';
  }
}
