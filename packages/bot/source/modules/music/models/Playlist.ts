import { Track } from './Track.js';

export class Playlist {
   public id: string;
   public name: string;
   public description: string | null;
   public tracks: Track[];

   constructor({ id, name, description, tracks }: { id: string; name: string; description: string | null; tracks: Track[] }) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.tracks = tracks;
   }
}
