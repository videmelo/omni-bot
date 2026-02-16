import type { TrackData } from './models/Track.js';
import type { ArtistData } from './models/Artist.js';
import type { AlbumData } from './models/Album.js';
import type { PlaylistData } from './models/Playlist.js';

export type SearchType = 'track' | 'top' | 'url';

export type SearchResultType = 'track' | 'album' | 'playlist' | 'artist' | 'search' | 'top';

export interface SearchResult {
  type: SearchResultType;
  items: SearchResultItems;
}

export interface SearchResultItems {
  tracks?: TrackData[];
  playlists?: PlaylistData[];
  albums?: AlbumData[];
  artists?: ArtistData[];
  top?: TopResult;
}

export interface TopResult {
  type: 'album' | 'artist' | 'track';
  name: string;
  popularity: number;
  [key: string]: unknown;
}

export interface SearchOptions {
  types?: Array<'track' | 'album' | 'playlist' | 'artist'>;
  limit?: number;
  offset?: number;
}
