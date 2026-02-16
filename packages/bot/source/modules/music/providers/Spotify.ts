import SpotifyWebApi from 'spotify-web-api-node';
import Logger from '../../../utils/logger.js';
import axios from 'axios';
import { Provider } from './base/Provider.js';
import type {
  SearchResult,
  SearchOptions,
  TrackData,
  AlbumData,
  PlaylistData,
  ArtistData,
} from '@omni/shared';

interface SpotifyConfig {
  id: string;
  secret: string;
  lastfmApiKey?: string;
}

export class Spotify extends Provider {
  public readonly name = 'spotify';
  private api: SpotifyWebApi;
  private expiration: number;
  private lastfmApiKey: string;
  public readonly urls: { pattern: RegExp };

  constructor({ id, secret, lastfmApiKey = '' }: SpotifyConfig) {
    super();
    this.lastfmApiKey = lastfmApiKey;
    this.api = new SpotifyWebApi({
      clientId: id,
      clientSecret: secret,
    });

    this.expiration = 0;
    this.api
      .clientCredentialsGrant()
      .then((data) => {
        this.expiration = new Date().getTime() / 1000 + data.body['expires_in'];
        this.api.setAccessToken(data.body['access_token']);
      })
      .catch((err: unknown) => {
        Logger.error(
          'Something went wrong when retrieving an access token',
          err instanceof Error ? err : String(err),
        );
      });

    this.urls = {
      pattern:
        /https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([a-zA-Z0-9]{22})/,
    };
  }

  protected override async ensureAuthenticated(): Promise<void> {
    if (this.expiration < new Date().getTime() / 1000) {
      await this.refreshAccessToken();
    }
  }

  protected override async handleRequestError(
    err: unknown,
    // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<boolean> {
    if (typeof err === 'object' && err !== null && 'statusCode' in err) {
      const httpErr = err as { statusCode: number; headers?: Record<string, string> };
      if (httpErr.statusCode === 429) {
        const retryAfter = parseInt(httpErr.headers?.['retry-after'] ?? '5', 10) || 5;
        Logger.warn(`Rate limit reached. Retrying in ${retryAfter} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return true;
      }
    }
    return false;
  }

  private async refreshAccessToken(): Promise<string> {
    const data = await this.api.clientCredentialsGrant();
    this.api.setAccessToken(data.body['access_token']);
    this.expiration = new Date().getTime() / 1000 + data.body['expires_in'];
    return data.body['access_token'];
  }

  async search(
    query: string,
    options: SearchOptions = { types: ['track'] },
  ): Promise<SearchResult> {
    if (this.urls.pattern.test(query)) {
      return await this.resolve(query);
    }

    const spotifyTypes = options.types ?? ['track']; // Removed unnecessary cast

    const result = await this.request(() =>
      this.api.search(query, spotifyTypes, { limit: options.limit }),
    );

    if (!result.body || !result.body.tracks || !result.body.tracks.items) {
      throw new Error('No results found for query: ' + query);
    }

    return {
      type: spotifyTypes.length > 1 ? 'search' : spotifyTypes[0],
      items: {
        tracks:
          result.body.tracks.items
            .filter((track) => (track.album?.album_type === 'single' ? null : track))
            .map((track) => this.buildTrack(track)) || [],
        artists:
          result.body.artists?.items
            .filter((artist) => artist.images?.[0]?.url)
            .map(
              (artist): ArtistData => ({
                type: 'artist',
                id: artist.id,
                name: artist.name,
                icon: artist.images?.[0]?.url,
                popularity: artist.popularity,
                url: artist.external_urls?.spotify,
                genres: artist.genres,
                followers: artist.followers,
              }),
            ) || [],
        albums:
          result.body.albums?.items.map(
            (album): AlbumData => ({
              type: 'album',
              id: album.id,
              name: album.name,
              artists: album.artists.map((artist) => ({ name: artist.name, id: artist.id })),
              total: album.total_tracks,
              icon: album.images[0]?.url,
              url: album.external_urls.spotify,
              tracks: [],
            }),
          ) || [],
        playlists: [],
      },
    };
  }

  async resolve(url: string): Promise<SearchResult> {
    const match = this.urls.pattern.exec(url);
    if (!match) {
      throw new Error('Invalid Spotify URL: ' + url);
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
      default:
        throw new Error('Type not supported: ' + type);
    }
  }

  async getPlaylist(id: string): Promise<PlaylistData> {
    const playlist = await this.request(() => this.api.getPlaylist(id).then((p) => p.body));

    if (playlist.tracks.total === 0) {
      throw new Error('Playlist is empty: ' + id);
    }

    const items = [...playlist.tracks.items];
    const total = playlist.tracks.total;

    if (total > 100) {
      for (let offset = 100; offset < total; offset += 100) {
        const tracksPage = await this.request(() =>
          this.api.getPlaylistTracks(id, { offset, limit: 100 }).then((res) => res.body.items),
        ).catch((error: unknown) => {
          Logger.error(
            'Failed to fetch playlist tracks:',
            error instanceof Error ? error : String(error),
          );
          return [];
        });

        items.push(...tracksPage);
      }
    }

    return {
      type: 'playlist',
      id: playlist.id,
      name: playlist.name,
      artist: playlist.owner.display_name ?? undefined,
      description: playlist.description,
      icon: playlist.images[0]?.url,
      url: playlist.external_urls.spotify,
      tracks: items
        .map((item) => (item.track ? this.buildTrack(item.track) : undefined))
        .filter(Boolean) as TrackData[],
      total,
    };
  }

  async getTrack(id: string): Promise<TrackData> {
    const track = await this.request(() => this.api.getTrack(id).then((t) => t.body));
    return this.buildTrack(track);
  }

  async getAlbum(id: string): Promise<AlbumData> {
    const album = await this.request(() => this.api.getAlbum(id).then((a) => a.body));

    return {
      type: 'album',
      id: album.id,
      name: album.name,
      artists: album.artists,
      icon: album.images[0].url,
      url: album.external_urls.spotify,
      total: album.tracks.total,
      tracks: album.tracks.items.map((t) => this.buildTrack(t, album)),
      popularity: album.popularity,
    };
  }

  async getArtist(id: string): Promise<ArtistData> {
    const artist = await this.request(() => this.api.getArtist(id).then((a) => a.body));

    return {
      type: 'artist',
      id: artist.id,
      name: artist.name,
      icon: artist.images?.[0]?.url,
      url: artist.external_urls?.spotify,
      genres: artist.genres,
      followers: artist.followers,
      popularity: artist.popularity,
    };
  }

  async getRelated(track: TrackData): Promise<unknown> {
    const related = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'track.getSimilar',
        artist: track.artist.name,
        track: track.name,
        api_key: this.lastfmApiKey,
        format: 'json',
      },
    });
    return related.data;
  }

  async getTopResults(query: string) {
    const { artists, albums, tracks } = await this.search(query, {
      types: ['artist', 'album', 'track'],
      limit: 15,
    }).then(async (res) => {
      const tracks = res.items.tracks ?? [];
      const albums = await Promise.all(
        (res.items.albums ?? [])
          .filter((item) => item.type === 'album')
          .map(async (item, index) => {
            if (index > 0) return item;
            const album = await this.getAlbum(item.id);
            return album;
          }),
      );
      const artists = res.items.artists ?? [];

      return { artists, albums, tracks };
    });
    if (!tracks.length || !albums.length || !artists.length) return null;

    type MatchType = 'album' | 'artist' | 'track';
    interface MatchItem {
      type: MatchType;
      name: string;
      popularity: number;
    }

    const priority: Record<MatchType, number> = {
      album: 1.25,
      artist: 1.2,
      track: 1.15,
    };
    const matches: MatchItem[] = [];
    let result: MatchItem[] = [
      {
        type: 'track',
        name: tracks[0]?.name ?? '',
        popularity: (tracks[0] as TrackData & { popularity?: number })?.popularity ?? 0,
      },
      { type: 'album', name: albums[0]?.name ?? '', popularity: albums[0]?.popularity ?? 0 },
      { type: 'artist', name: artists[0]?.name ?? '', popularity: artists[0]?.popularity ?? 0 },
    ];

    result = result.map((item) => {
      if (item?.name.toLowerCase().match(query.toLowerCase())) matches.push(item);
      return item;
    });

    if (matches.length > 1) {
      result = matches.sort(
        (a, b) => b.popularity * priority[b.type] - a.popularity * priority[a.type],
      );
    } else if (matches.length === 1) {
      result = matches;
    } else {
      result = result.sort(
        (a, b) => b.popularity * priority[b.type] - a.popularity * priority[a.type],
      );
    }

    return {
      tracks,
      albums,
      artists,
      top: { ...result[0] },
    };
  }

  private buildTrack(
    track: SpotifyApi.TrackObjectFull | SpotifyApi.TrackObjectSimplified,
    album?: SpotifyApi.AlbumObjectSimplified | SpotifyApi.AlbumObjectFull,
  ): TrackData {
    const albumData = (track as SpotifyApi.TrackObjectFull).album || album;
    return {
      type: 'track',
      source: 'spotify',
      id: track.id,
      name: track.name,
      url: track.external_urls.spotify,
      artist: {
        name: track.artists?.[0]?.name || 'Unknown Artist',
        id: track.artists?.[0]?.id || '',
        url: track.artists?.[0]?.external_urls?.spotify || '',
      },
      duration: track.duration_ms,
      icon: albumData?.images?.[0]?.url || undefined,
      album: albumData
        ? {
            name: albumData.name,
            id: albumData.id,
            url: albumData.external_urls?.spotify || '',
            icon: albumData.images?.[0]?.url,
          }
        : undefined,
    };
  }
}
