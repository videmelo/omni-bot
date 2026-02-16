import {
  Client as DeezerApi,
  Track as DeezerTrack,
  Album as DeezerAlbum,
  Artist as DeezerArtist,
} from 'deezer-ts';
import { Provider } from './base/Provider.js';
import type { SearchResult, TrackData, AlbumData, PlaylistData, ArtistData } from '@omni/shared';

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
    icon: string;
  }[];
}

export class Deezer extends Provider {
  public readonly name = 'deezer';
  public api: DeezerApi;
  public readonly urls: { pattern: RegExp };

  constructor() {
    super();
    this.api = new DeezerApi({ headers: 'Accept-Language: en' });
    this.urls = {
      pattern: /https?:\/\/(?:www\.)?deezer\.com\/(?:\w+\/)?(track|album|playlist|artist)\/(\d+)/,
    };
  }

  async search(query: string): Promise<SearchResult> {
    const tracks = await this.api.request<DeezerTrack[]>(
      'GET',
      `search/track?q=${query}`,
      false,
    );
    const albums = await this.api.request<DeezerAlbum[]>(
      'GET',
      `search/album?q=${query}`,
      false,
    );
    const artists = await this.api.request<DeezerArtist[]>(
      'GET',
      `search/artist?q=${query}`,
      false,
    );

    return {
      type: 'search',
      items: {
        tracks: tracks.map((t) => this.buildTrack(t)),
        albums: albums.map(
          (a): AlbumData => ({
            type: 'album',
            id: String(a.id),
            name: a.title,
            total: a.nb_tracks ?? 0,
            icon: a.cover_xl,
            url: a.link || '',
          }),
        ),
        artists: artists.map(
          (a): ArtistData => ({
            type: 'artist',
            id: String(a.id),
            name: a.name,
            icon: a.picture_xl,
            url: a.link,
          }),
        ),
      },
    };
  }

  async resolve(url: string): Promise<SearchResult> {
    const match = this.urls.pattern.exec(url);
    if (!match) {
      throw new Error('Invalid Deezer URL: ' + url);
    }
    const type = match[1];
    const id = match[2];

    switch (type) {
      case 'track': {
        const track = await this.getTrack(id);
        return { type: 'track', items: { tracks: [track] } };
      }
      case 'album': {
        const album = await this.getAlbum(id);
        return { type: 'album', items: { albums: [album] } };
      }
      case 'playlist': {
        const playlist = await this.getPlaylist(id);
        return { type: 'playlist', items: { playlists: [playlist] } };
      }
      case 'artist': {
        const artist = await this.getArtist(id);
        return { type: 'artist', items: { artists: [artist] } };
      }
      default:
        throw new Error('Type not supported: ' + type);
    }
  }

  async getTrack(id: string): Promise<TrackData> {
    const track = await this.api.request<DeezerTrack>('GET', `track/${id}`, false);
    return this.buildTrack(track);
  }

  async getAlbum(id: string): Promise<AlbumData> {
    const album = await this.api.request<DeezerAlbum>('GET', `album/${id}`, false);
    const tracks = await this.getAlbumTracks(id);

    return {
      type: 'album',
      id: String(album.id),
      name: album.title,
      artists: album.artist
        ? [{ name: album.artist.name, id: String(album.artist.id) }]
        : undefined,
      total: album.nb_tracks ?? 0,
      icon: album.cover_xl,
      url: album.link || '',
      tracks,
    };
  }

  async getPlaylist(id: string): Promise<PlaylistData> {
    const tracks = await this.getPlaylistTracks(id);
    return {
      type: 'playlist',
      id,
      name: `Deezer Playlist ${id}`,
      total: tracks.length,
      tracks,
    };
  }

  async getArtist(id: string): Promise<ArtistData> {
    const artist = await this.api.request<DeezerArtist>('GET', `artist/${id}`, false);

    return {
      type: 'artist',
      id: String(artist.id),
      name: artist.name,
      icon: artist.picture_xl,
      url: artist.link,
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
      }),
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

  async getPlaylistTracks(id: string | number): Promise<TrackData[]> {
    const tracks = await this.api.request<DeezerTrack[]>('GET', `playlist/${id}/tracks`, false);
    return tracks.map((track) => this.buildTrack(track));
  }

  async getAlbumTracks(id: string | number): Promise<TrackData[]> {
    const tracks = await this.api.request<DeezerTrack[]>('GET', `album/${id}/tracks`, false);
    return tracks.map((track) => this.buildTrack(track));
  }

  private buildTrack(t: DeezerTrack): TrackData {
    return {
      type: 'track',
      id: String(t.id),
      name: t.title,
      source: 'deezer',
      url: t.link || '',
      icon: t.album?.cover_xl,
      requester: t.md5_image,
      artist: {
        id: String(t.artist?.id ?? ''),
        name: t.artist?.name ?? 'Unknown',
        icon: t.artist?.picture_xl,
        url: t.artist?.link,
      },
      album: t.album
        ? {
          id: String(t.album.id),
          name: t.album.title,
          icon: t.album.cover_xl,
        }
        : undefined,
      duration: t.duration * 1000,
      explicit: !!t.explicit_content_lyrics,
    };
  }
}
