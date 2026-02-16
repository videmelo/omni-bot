import { Collection } from 'discord.js';
import fs from 'node:fs/promises';
import { Radio } from '../Radio.js';
import { Track } from '../models/Track.js';
import Bot from '../../../core/Bot.js';

interface RadioPlaylist {
  genre: {
    id: string;
    name: string;
  };
  playlists: {
    id: number | string;
    name: string;
    tracks: Track[];
  }[];
}

interface RawRadioList {
  name: string;
  id: string; // or number?
  // ... other props
  playlists: {
    name: string;
    ids: number[];
  }[];
}

export class RadioManager {
  public list: Collection<string, Radio>;
  private client: Bot;
  constructor(client: Bot) {
    this.list = new Collection();
    this.client = client;
  }

  async init() {
    const data = await fs.readFile('radios.json', 'utf8');
    const radios = JSON.parse(data) as RadioPlaylist[];
    radios.map((item) => {
      item.playlists.map((list) => {
        if (!list.tracks?.length) return;
        const radio = new Radio(this.client, {
          genre: { id: item.genre.id.toString(), name: item.genre.name },
          id: list.id.toString(),
          playlist: list.tracks.map((track) => new Track(track)),
          name: list.name,
        });
        this.list.set(radio.id, radio);
      });
    });
  }

  get(id: string) {
    return this.list.get(id);
  }

  async build() {
    const data = await fs.readFile('lists.json', 'utf8');
    const list = JSON.parse(data) as RawRadioList[];

    const radios = await Promise.all(
      list.map(async (radio) => ({
        ...radio,
        playlists: await Promise.all(
          radio.playlists.map(async (playlist) => ({
            name: playlist.name,
            id: playlist.ids.join(),
            tracks: (
              await Promise.all(
                playlist.ids.map(
                  async (id) => await this.client.search.deezer.getPlaylistTracks(id.toString()),
                ),
              )
            ).flat(),
          })),
        ),
      })),
    );
    await fs.writeFile('radios.json', JSON.stringify(radios, null, 2), 'utf8');
  }
}
