import type { TrackData } from './Track.js';

export interface PlaylistData {
  type?: 'playlist';
  id: string;
  name: string;
  description?: string | null;
  icon?: string;
  url?: string;
  artist?: string | { name: string; id: string };
  total: number;
  tracks: TrackData[];
}
