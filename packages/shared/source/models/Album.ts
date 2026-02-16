import type { TrackData } from './Track.js';

export interface AlbumData {
  type?: 'album';
  id: string;
  name: string;
  artists?: Array<{ name: string; id: string }>;
  total: number;
  icon?: string;
  url: string;
  tracks?: TrackData[];
  popularity?: number;
}
