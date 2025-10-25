import { Collection } from 'discord.js';
import { Playback, Player, Radio, Track, Playlist } from './index.js';

type RepeatTypes = 'off' | 'track' | 'queue';

type QueueController = Player | Radio;

export class Queue {
   public tracks: Collection<string, Track> = new Collection();
   public repeat: RepeatTypes;
   public guild: string;
   private controller: Playback;
   public shuffled: boolean;

   constructor(guild: string, controller: Playback) {
      this.guild = guild;
      this.repeat = 'off';
      this.shuffled = false;
      this.controller = controller;
   }

   new(item: Track | Track[] | Playlist, options?: { requester?: string }) {
      if (!item) return;
      let track;

      const setTrackInQueue = (item: Track) => {
         if (this.tracks.has(item.id)) return this.tracks.get(item.id);
         item.index = item.index ?? this.tracks.size;
         item.requester = item.requester ?? (options?.requester || null);

         this.tracks.set(item.id, item);
         return item;
      };

      if (item instanceof Playlist) {
         let list = { ...item, requester: options?.requester || null };
         for (let track of list.tracks) {
            track.index = this.tracks.size;
            track.requester = options?.requester || null;
            this.tracks.set(track.id, new Track(track));
         }
         this.controller.socket();
         return this.tracks.find((track) => track.id === list.tracks[0].id);
      } else if (item instanceof Track) {
         track = setTrackInQueue(item);

         this.controller.emit('newTrack', this.controller, track);
         this.controller.socket();
         return track;
      } else if (item.every((item) => item instanceof Track)) {
         item.map((track) => setTrackInQueue(track));
         return this.tracks.find((track) => track.id === item[0].id);
      }
   }

   next() {
      if (!this.controller.current) return;
      const current = this.tracks.get(this.controller.current.id);
      if (!current) return null;
      const index = current.index;
      if (index === undefined || index === null) return null;

      if (this.repeat === 'track') return this.controller.current;

      const next = this.tracks.at(index + 1) || null;
      if (!next && this.repeat === 'queue') return this.tracks.at(0) || null;

      return next;
   }

   previous() {
      if (!this.controller.current) return;
      const current = this.tracks.get(this.controller.current.id);
      if (!current) return null;
      const index = current.index;
      if (index === undefined || index === null) return null;

      if (this.repeat === 'track') return this.controller.current;
      let previous = this.tracks.at(index - 1) || null;
      if (!previous && this.repeat === 'queue') {
         previous = this.tracks.at(this.tracks.size - 1) || null;
      }

      return previous;
   }

   get(index: number) {
      if (index < 0 || index >= this.tracks.size) return null;
      return this.tracks.at(index);
   }

   remove(index: number) {
      if (index < 0 || index >= this.tracks.size) return null;
      const track = this.tracks.at(index)!;
      this.tracks.delete(track.id);
      this.controller.socket();
      return track;
   }

   clear() {
      this.tracks.clear();
      const current = this.controller.current;
      if (this.controller.playing && current) this.tracks.set(current.id, { index: 0, ogidx: 0, ...current });
      this.controller.socket();
   }

   shuffle() {
      if (this.tracks.size < 2) return null;
      if (this.shuffled) return;
      this.tracks = this.tracks.sort(() => Math.random() - Math.random());

      let index = 0;
      this.tracks = this.tracks.mapValues((track) => {
         track.ogidx = track.index;
         track.index = index++;
         return track;
      });
      this.shuffled = true;
      this.controller.socket();
      return this.tracks;
   }

   reorder() {
      if (!this.shuffled) return;
      this.tracks.sort((a, b) => {
         if (a.ogidx! < b.ogidx!) return -1;
         if (a.ogidx! > b.ogidx!) return 1;
         return 0;
      });
      this.tracks = this.tracks.mapValues((track) => {
         track.index = track.ogidx;
         track.ogidx = track.index;
         return track;
      });

      this.shuffled = false;
      this.controller.socket();
      return this.tracks;
   }

   setRepeat(mode: RepeatTypes) {
      this.repeat = mode;
      this.controller.socket();
   }

   getQueueDuration() {
      let time: number = 0;
      this.tracks.map((track) => {
         time = track.duration + time;
      });
      return time;
   }
}
