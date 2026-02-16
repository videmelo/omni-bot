import type { AlbumData, TrackData } from '@omni/shared';

export type { AlbumData };

export class Album implements AlbumData {
  public type?: 'album';
  public id: string;
  public name: string;
  public artists?: Array<{ name: string; id: string }>;
  public total: number;
  public icon?: string;
  public url: string;
  public tracks?: TrackData[];
  public popularity?: number;

  constructor({ id, name, artists, total, icon, url, tracks, popularity }: AlbumData) {
    this.type = 'album';
    this.id = id;
    this.name = name;
    this.artists = artists;
    this.total = total;
    this.icon = icon;
    this.url = url;
    this.tracks = tracks;
    this.popularity = popularity;
  }
}
