import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Section from '../components/Section.js';
import socket from '../services/socket.js';
import Play from '../assets/icons/Play.js';

type Artist = {
   id: string;
   name: string;
   icon?: string;
   type: 'artist';
};

type Album = {
   id: string;
   name: string;
   icon?: string;
   artist: Artist;
   type: 'album';
};

type Track = {
   id: string;
   name: string;  
   icon?: string;
   artist: Artist;
   type: 'track';
};

type TopResult = {
   id: string;
   name: string;
   icon?: string;
   type: 'artist' | 'album' | 'track';
   artists?: Artist[];
   artist?: Artist;
};

type SearchResult = {
   items: {
      tracks: Track[];
      albums: Album[];
      artists: Artist[];
      top: TopResult;
   };
};

const SkeletonTopResult = () => (
   <div className="flex overflow-x-auto scrollbar-none gap-3 bg-black bg-opacity-40 rounded-2xl animate-pulse">
      <div className="h-[180px] min-w-[180px] rounded-l-2xl bg-white bg-opacity-5" />
      <div className="flex flex-col w-full min-w-0 p-4 pb-0">
         <div className="h-8 w-3/4 bg-white bg-opacity-5 rounded-md mb-2" />
         <div className="flex gap-1">
            <div className="h-5 w-20 bg-white bg-opacity-5 rounded-md" />
            <div className="h-5 w-32 bg-white bg-opacity-5 rounded-md" />
         </div>
      </div>
   </div>
);

const SkeletonTrackItem = () => (
   <div className="flex items-center gap-3 p-1 rounded-md animate-pulse">
      <div className="h-[50px] w-[50px] rounded-md bg-white bg-opacity-5" />
      <div className="w-full min-w-0">
         <div className="h-4 w-72 bg-white bg-opacity-5 rounded-md mb-1" />
         <div className="h-3 w-24 bg-white bg-opacity-5 rounded-md" />
      </div>
   </div>
);

// --- Main Page Component ---

export default function Page() {
   const [searchParams] = useSearchParams();
   const query = searchParams.get('q');
   const navigate = useNavigate();

   const [loading, setLoading] = useState<boolean>(true);
   const [tracks, setTracks] = useState<Track[]>([]);
   const [albums, setAlbums] = useState<Album[]>([]);
   const [artists, setArtists] = useState<Artist[]>([]);
   const [top, setTop] = useState<TopResult | null>(null);

   useEffect(() => {
      setLoading(true);
      if (query) {
         socket.emit('search:top', query, (result: SearchResult) => {
            setTracks(result.items.tracks);
            setAlbums(result.items.albums);
            setArtists(result.items.artists);
            setTop(result.items.top);
            setLoading(false);
         });
      } else {
         navigate('/');
         setLoading(false);
      }
   }, [navigate, query]);

   function handleItemClick(item: Track | Album | Artist) {
      socket.emit('player:play', item);
   }

   if (loading) {
      return (
         <main className="w-full flex flex-col p-6 gap-6">
            <div className="flex flex-col w-full gap-3">
               <div className="flex items-center shrink-0 font-medium text-2xl text">Searching...</div>
               <div className="flex flex-col gap-6">
                  <div className="w-full">
                     <SkeletonTopResult />
                  </div>

                  <div className="flex flex-col w-full gap-2">
                     {Array.from({ length: 4 }).map((n, i) => (
                        <SkeletonTrackItem key={i} />
                     ))}
                  </div>
               </div>
            </div>
            <div className="flex flex-col gap-5">
               <Section />
               <Section />
               <Section />
            </div>
         </main>
      );
   }

   if (!top?.id && !tracks.length && !artists.length && !albums.length) {
      return (
         <main className="w-full flex flex-col p-6 gap-3">
            <div className="flex items-center justify-center h-40 text-lg text-gray-400">No results found for "{query}".</div>
         </main>
      );
   }

   return (
      <main className="w-full  flex flex-col p-6 gap-6">
         {top?.id && (
            <div className="flex flex-col w-full gap-3">
               <div className="flex items-center shrink-0 font-medium text-2xl text">Top Result</div>
               <div className="flex overflow-x-auto scrollbar-none gap-3 bg-black bg-opacity-40 hover:bg-opacity-50 rounded-2xl group">
                  <img
                     src={top?.icon || top?.icon}
                     className={`h-[180px] min-w-0 rounded-l-2xl w-[180px] object-cover shrink-0 shadow-inner`}
                     alt={top.name}
                  />

                  <div className="flex w-full min-w-0 justify-between">
                     <div className="flex flex-col min-w-0 gap-1 p-4 pb-0">
                        <div className="font-poppins font-bold text-3xl truncate min-w-0 w-full">{top?.name}</div>

                        <div className="font-poppins flex gap-1 font-normal text-base text-[#B3B3B3]">
                           <span className="capitalize w-fit bg-white p-[2px] px-2 rounded-md text-sm bg-opacity-10">{top?.type}</span>
                           <span className="whitespace-nowrap">{top.artists ? top.artists[0].name : (top.artist?.name ?? null)}</span>
                        </div>
                     </div>

                     <button className="flex shrink-0 mt-auto m-4 items-center justify-center rounded-full h-fit w-fit p-2 bg-white transition-all opacity-0 group-hover:opacity-100">
                        <Play />
                     </button>
                  </div>
               </div>

               {tracks.length > 0 && (
                  <div className="flex flex-col w-full">
                     {tracks.slice(0, 4).map(({ name, artist, icon, id }) => (
                        <div key={id} className="flex items-center gap-3 cursor-pointer hover:bg-white hover:bg-opacity-5 p-1 rounded-md">
                           <img src={icon} className="h-[50px] w-[50px] rounded-md" alt={name} />

                           <div className="w-full min-w-0">
                              <div className="font-medium text-sm font-poppins text-white truncate">{name}</div>
                              <div className="font-normal text-xs font-poppins text-[#B3B3B3]">{artist.name}</div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}

         <div className="flex flex-col gap-5">
            {tracks.length > 0 ? (
               <Section
                  data={tracks}
                  title="Tracks"
                  onClick={(event: React.MouseEvent, item: Track) => handleItemClick(item)}
                  onAppend={(event: React.MouseEvent, track: Track) => {
                     event.stopPropagation();
                     socket.emit('queue:new', track);
                  }}
               />
            ) : null}
            {albums.length > 0 ? <Section data={albums} title="Albums"/> : null}
            {artists.length > 0 ? <Section data={artists} title="Artists" rounded/> : null}
         </div>
      </main>
   );
}
