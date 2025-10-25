export interface Track {
   name: string;
   type?: 'track';
   streamable?: string;
   duration: number;
   icon?: string;
   artist: TrackArtist;
   id: string;
   url: string;
   key?: string;
   source: 'spotify' | 'youtube' | 'deezer';
   index?: number;
   ogidx?: number;
   requester?: string | null;
   explicit?: boolean;
   cached?: boolean;
   album?: {
      name: string;
      id: string;
      url?: string;
      icon?: string;
   };
   metadata?: TrackMetadata;
}

export interface TrackMetadata {
   source: 'youtube';
   id: string;
   url: string;
   name: string;
   duration: number;
   explicit?: boolean;
   icon?: string;
   artist: TrackArtist;
}

export interface TrackArtist {
   name: string;
   id: string;
   url?: string;
   icon?: string;
}

export class Track implements Track {
   constructor({ source, id, name, artist, icon, explicit = false, duration, streamable, url, index, ogidx, requester, cached = false, metadata, album }: Track) {
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

export class TrackMetadata implements TrackMetadata {
   constructor({ source, id, url, name, duration, explicit = false, icon, artist }: TrackMetadata) {
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
