import { Collection } from 'discord.js';
import { Track, Deezer, Spotify, YouTube, Playlist } from './index.js';
import type { Provider } from './providers/base/Provider.js';
import type { SearchResult, SearchType } from '@omni/shared';

export type { SearchResult };

interface SearchOptions {
  spotify: { id: string; secret: string };
  engine?: 'spotify' | 'deezer';
  youtube?: { cookies?: string };
  lastfmApiKey?: string;
}

export class Search {
  public spotify: Spotify;
  public youtube: YouTube;
  public deezer: Deezer;
  public cache: Collection<string, SearchResult>;
  public engine: Provider;

  constructor({ spotify, engine = 'spotify', youtube, lastfmApiKey }: SearchOptions) {
    this.spotify = new Spotify({
      id: spotify.id,
      secret: spotify.secret,
      lastfmApiKey,
    });

    this.deezer = new Deezer();

    this.youtube = new YouTube({ cookies: youtube?.cookies });
    this.cache = new Collection();

    this.engine = engine === 'deezer' ? this.deezer : this.spotify;
  }

  async resolve(
    query: string,
    options: { type?: SearchType; limit?: number } = { limit: 5 },
  ): Promise<SearchResult | undefined> {
    options.type ??= this.idealSearchType(query);
    if (!options.type) return;

    query = query.slice(0, 250);

    const cache = this.incache(query);
    if (cache?.type === options.type) return cache;

    switch (options.type) {
      case 'track': {
        const result = await this.engine.search(query, {
          types: ['track'],
          limit: options.limit,
        });
        const search: SearchResult = {
          type: 'track',
          items: { tracks: result.items?.tracks?.map((t) => new Track(t)) ?? [] },
        };
        this.encache(query, search);
        return search;
      }
      case 'top': {
        const result = await this.spotify.getTopResults(query);
        if (!result) return;
        const search: SearchResult = {
          type: 'top',
          items: { ...result, tracks: result.tracks.map((t) => new Track(t)) },
        };
        this.encache(query, search);
        return search;
      }
      case 'url': {
        const info = this.infoUrl(query);
        if (!info) return;

        if (info.stream === 'spotify') {
          const result = await this.spotify.resolve(query);
          const search: SearchResult = {
            type: result.type,
            items: {
              ...result.items,
              tracks: result.items.tracks?.map((t) => new Track(t)) ?? [],
              playlists: result.items.playlists?.map((p) => new Playlist(p)) ?? [],
            },
          };
          this.encache(query, search);
          return search;
        }

        if (info.stream === 'deezer') {
          const result = await this.deezer.resolve(query);
          const search: SearchResult = {
            type: result.type,
            items: {
              ...result.items,
              tracks: result.items.tracks?.map((t) => new Track(t)) ?? [],
              playlists: result.items.playlists?.map((p) => new Playlist(p)) ?? [],
            },
          };
          this.encache(query, search);
          return search;
        }

        if (info.stream === 'youtube') {
          const result = await this.youtube.search(query);
          return {
            type: 'search',
            items: { tracks: [new Track(result)] },
          };
        }
        return;
      }
    }
  }

  encache(key: string, search: SearchResult) {
    this.cache.set(key.toLowerCase(), search);

    setTimeout(
      () => {
        this.cache.delete(key);
      },
      12 * 60 * 60 * 1000,
    );
  }

  incache(query: string) {
    const cache = this.cache.get(query.toLowerCase());
    return cache;
  }

  getcache(id: string) {
    for (const data of this.cache.values()) {
      if (data.items.tracks) {
        const track = data.items.tracks.find((track) => track.id === id);
        if (track) return track;
      }
    }
  }

  idealSearchType(query: string): SearchType | undefined {
    if (typeof query !== 'string') return;
    if (this.isUrl(query)) {
      const info = this.infoUrl(query);
      if (!info) return;
      if (info.stream === 'spotify' || info.stream === 'youtube' || info.stream === 'deezer')
        return 'url';
      return;
    } else return 'track';
  }

  isUrl(url: string): boolean {
    const isUrl =
      /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

    if (!url.match(isUrl)) return false;
    return true;
  }

  infoUrl(url: string): { stream: string; type: string; id: string } | null {
    if (this.spotify.urls.pattern.test(url)) {
      const match = this.spotify.urls.pattern.exec(url);
      if (!match) return null;
      return {
        stream: 'spotify',
        type: match[1],
        id: match[2],
      };
    }
    if (this.deezer.urls.pattern.test(url)) {
      const match = this.deezer.urls.pattern.exec(url);
      if (!match) return null;
      return {
        stream: 'deezer',
        type: match[1],
        id: match[2],
      };
    }
    if (this.youtube.urls.pattern.test(url)) {
      url.match(this.youtube.urls.pattern);
      const match = this.youtube.urls.pattern.exec(url);
      if (!match) return null;
      return {
        stream: 'youtube',
        type: match[6] ? 'playlist' : 'track',
        id: match[7],
      };
    }
    return null;
  }
}
