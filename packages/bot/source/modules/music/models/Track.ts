import type { TrackData, TrackMetadataData, TrackArtistData, AlbumReference } from '@omni/shared';

export type { TrackData, TrackMetadataData, TrackArtistData, AlbumReference };

export class Track implements TrackData {
  public name: string;
  public type?: 'track';
  public streamable?: string;
  public duration: number;
  public icon?: string;
  public artist: TrackArtistData;
  public id: string;
  public url: string;
  public key?: string;
  public source: 'spotify' | 'youtube' | 'deezer';
  public index?: number;
  public ogidx?: number;
  public requester?: string | null;
  public explicit?: boolean;
  public cached?: boolean;
  public album?: AlbumReference;
  public metadata?: TrackMetadata;

  constructor({
    source,
    id,
    name,
    artist,
    icon,
    explicit = false,
    duration,
    streamable,
    url,
    index,
    ogidx,
    requester,
    cached = false,
    metadata,
    album,
  }: TrackData) {
    this.type = 'track';
    this.name = name;
    this.url = url;
    this.source = source;
    this.duration = duration;
    this.icon = icon;
    this.metadata = metadata ? new TrackMetadata(metadata) : undefined;
    this.artist = artist
      ? {
          name: artist.name ?? this.metadata?.artist.name ?? 'Unknown Artist',
          id: artist.id,
          url: artist.url,
          icon: artist.icon || this.metadata?.artist.icon || undefined,
        }
      : {
          name: this.metadata?.artist.name ?? 'Unknown Artist',
          id: this.metadata?.artist.id ?? '',
          url: this.metadata?.artist.url,
          icon: this.metadata?.artist.icon,
        };
    this.key = Buffer.from(this.name + this.artist.name, 'utf8').toString('base64');
    this.album = album
      ? {
          name: album.name,
          id: album.id,
          url: album.url,
          icon: album.icon,
        }
      : undefined;

    this.id = id;
    this.index = index;
    this.ogidx = ogidx;
    this.requester = requester;
    this.source = source;
    this.explicit = explicit;
    this.cached = cached;
    this.streamable = streamable;
  }
}

export class TrackMetadata implements TrackMetadataData {
  public source: 'youtube';
  public id: string;
  public url: string;
  public name: string;
  public duration: number;
  public explicit?: boolean;
  public icon?: string;
  public artist: TrackArtistData;

  constructor({
    source,
    id,
    url,
    name,
    duration,
    explicit = false,
    icon,
    artist,
  }: TrackMetadataData) {
    this.source = source;
    this.id = id;
    this.url = url;
    this.name = name;
    this.duration = duration;
    this.explicit = explicit;
    this.icon = icon;
    this.artist = {
      name: artist.name,
      id: artist.id,
      url: artist.url,
      icon: artist.icon,
    };
  }
}
