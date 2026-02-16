export interface TrackArtistData {
  name: string;
  id: string;
  url?: string;
  icon?: string;
}

export interface TrackMetadataData {
  source: 'youtube';
  id: string;
  url: string;
  name: string;
  duration: number;
  explicit?: boolean;
  icon?: string;
  artist: TrackArtistData;
}

export interface TrackData {
  name: string;
  type?: 'track';
  streamable?: string;
  duration: number;
  icon?: string;
  artist: TrackArtistData;
  id: string;
  url: string;
  key?: string;
  source: 'spotify' | 'youtube' | 'deezer';
  index?: number;
  ogidx?: number;
  requester?: string | null;
  explicit?: boolean;
  cached?: boolean;
  album?: AlbumReference;
  metadata?: TrackMetadataData;
}

export interface AlbumReference {
  name: string;
  id: string;
  url?: string;
  icon?: string;
}
