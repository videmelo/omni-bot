import type { ArtistData } from '@omni/shared';

export type { ArtistData };

export class Artist implements ArtistData {
  public type?: 'artist';
  public id: string;
  public name: string;
  public icon?: string;
  public url?: string;
  public genres?: string[];
  public followers?: { total: number };
  public popularity?: number;

  constructor({ id, name, icon, url, genres, followers, popularity }: ArtistData) {
    this.type = 'artist';
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.url = url;
    this.genres = genres;
    this.followers = followers;
    this.popularity = popularity;
  }
}
