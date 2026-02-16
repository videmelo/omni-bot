export interface ArtistData {
  type?: 'artist';
  id: string;
  name: string;
  icon?: string;
  url?: string;
  genres?: string[];
  followers?: { total: number };
  popularity?: number;
}
