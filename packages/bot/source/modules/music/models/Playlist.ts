import type { PlaylistData, TrackData } from '@omni/shared';
import { Track } from './Track.js';

export type { PlaylistData };

export class Playlist implements PlaylistData {
  public type?: 'playlist';
  public id: string;
  public name: string;
  public description?: string | null;
  public icon?: string;
  public url?: string;
  public artist?: string | { name: string; id: string };
  public total: number;
  public tracks: Track[];

  constructor({ id, name, description, icon, url, artist, total, tracks }: PlaylistData) {
    this.type = 'playlist';
    this.id = id;
    this.name = name;
    this.description = description ?? null;
    this.icon = icon;
    this.url = url;
    this.artist = artist;
    this.total = total ?? tracks.length;
    this.tracks = tracks.map((t: TrackData) => (t instanceof Track ? t : new Track(t)));
  }
}
