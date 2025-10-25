import { Collection } from 'discord.js';
import { Track } from '../models/Track.js';
import { Playlist } from '../models/Playlist.js';
import Spotify from './Spotify.js';
import YouTube from './Youtube.js';
import Deezer from './Deezer.js';

type SearchType = 'track' | 'top' | 'url';

interface SearchResult {
   type: 'track' | 'album' | 'playlist' | 'artist' | 'search' | 'top';
   items: {
      tracks?: Track[];
      playlists?: Playlist[];
      albums?: any[];
      artists?: any[];
      top?: any;
   };
}

interface SearchOptions {
   spotify: { id: string; secret: string };
   youtube?: { cookies: string };
   engine?: 'spotify' | 'deezer';
}

export default class Search {
   public spotify: Spotify;
   public youtube: YouTube;
   public deezer: Deezer;
   public cache: Collection<string, SearchResult>;
   public engine: Spotify | Deezer;

   constructor({ spotify, youtube, engine = 'spotify' }: SearchOptions) {
      this.spotify = new Spotify({
         id: spotify.id,
         secret: spotify.secret,
      });

      this.deezer = new Deezer();

      this.youtube = new YouTube(youtube?.cookies);
      this.cache = new Collection();

      this.engine = engine == 'deezer' ? this.deezer : this.spotify;
   }

   async resolve(query: string, options: { type?: SearchType; limit?: number } = { limit: 5 }): Promise<SearchResult | undefined> {
      options.type ??= this.idealSearchType(query);
      if (!options.type) return;

      query = query.slice(0, 250);

      const cache = this.incache(query);
      if (cache?.type == options.type) return cache;

      switch (options.type) {
         case 'track': {
            const result = await this.spotify.search(query, {
               types: ['track'],
               limit: options.limit,
            });
            let search: SearchResult = {
               type: 'track',
               items: { tracks: result.items.tracks.map((t) => new Track(t)) },
            };
            this.encache(query, search);
            return search;
         }
         case 'top': {
            const result = await this.spotify.getTopResults(query);
            if (!result) return;
            let search: SearchResult = {
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
               let search: SearchResult = {
                  type: result.type,
                  items: {
                     ...result.items,
                     tracks: result.items.tracks.map((t) => new Track(t)),
                     playlists: result.items.playlists.map((p) => new Playlist(p)),
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

      setTimeout(() => {
         this.cache.delete(key);
      }, 12 * 60 * 60 * 1000);
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
      if (typeof query != 'string') return;
      if (this.isUrl(query)) {
         const info = this.infoUrl(query);
         if (!info) return;
         if (info.stream == 'spotify') return 'url';
         else if (info.stream == 'youtube') return 'url';
         else return;
      } else return 'track';
   }

   isUrl(url: string): boolean {
      const isUrl = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/g;

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
