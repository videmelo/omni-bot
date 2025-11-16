import { Client as DeezerApi, Track as DeezerTrack, Album as DeezerAlbum, Artist as DeezerArtist, Artist } from 'deezer-ts';
import { SearchResult, Track } from '../index.js';

export interface RadioPlaylist {
   genre: {
      name: string;
      id: number;
      icon: string;
   };
   playlists: {
      name: string;
      description: string;
      id: number;
      tracks?: Track[];
      icon: string;
   }[];
}

export class Deezer {
   public api;
   constructor() {
      this.api = new DeezerApi({ headers: 'Accept-Language: en' });
   }

   async search(query: string): Promise<SearchResult> {
      const tracks = (await this.api.request('GET', `search/track?q=${query}`, false)) as DeezerTrack[];
      const albums = (await this.api.request('GET', `search/album?q=${query}`, false)) as DeezerAlbum[];
      const artists = (await this.api.request('GET', `search/artist?q=${query}`, false)) as DeezerArtist[];

      return {
         type: 'search',
         items: {
            tracks: tracks.map((t) => {
               return new Track({
                  id: String(t.id),
                  name: t.title,
                  source: 'deezer',
                  url: t.link || '',
                  icon: t.album.cover_xl,
                  requester: t.md5_image,
                  artist: {
                     id: String(t.artist.id),
                     name: t.artist.name,
                     icon: t.artist.picture_xl,
                     url: t.artist.link,
                  },
                  album: {
                     id: String(t.album.id),
                     name: t.album.title,
                     icon: t.album.cover_xl,
                  },
                  duration: t.duration * 1000,
                  explicit: !!t.explicit_content_lyrics,
               });
            }),
            albums: albums,
            artists: artists,
         },
      };
   }

   async buildRadiosPlaylists(genres: number[]): Promise<RadioPlaylist[] | undefined> {
      if (!genres.length) return;
      const lists = await Promise.all(
         genres.map(async (id) => {
            const genre = await this.api.getGenre(id);
            const playlists = await this.api.getPlaylistsChart(id);
            return {
               genre,
               playlists,
            };
         })
      );

      const radios = lists.map((radio) => {
         return {
            genre: {
               name: radio.genre.name,
               id: radio.genre.id,
               icon: radio.genre.picture_xl,
            },
            playlists: radio.playlists.map((list) => {
               return {
                  name: list.title,
                  description: list.description,
                  id: list.id,
                  icon: list.picture_xl,
               };
            }),
         };
      });
      return radios;
   }

   async getPlaylistTracks(id: any): Promise<Track[]> {
      const tracks = (await this.api.request('GET', `playlist/${id}/tracks`, false)) as DeezerTrack[];
      return tracks.map((track) => {
         return new Track({
            id: String(track.id),
            name: track.title,
            source: 'deezer',
            url: track.link || '',
            icon: track.album.cover_xl,
            requester: track.md5_image,
            artist: {
               id: String(track.artist.id),
               name: track.artist.name,
               icon: track.artist.picture_xl,
               url: track.artist.link,
            },
            album: {
               id: String(track.album.id),
               name: track.album.title,
               icon: track.album.cover_xl,
            },
            duration: track.duration * 1000,
            explicit: !!track.explicit_content_lyrics,
         });
      });
   }
}
