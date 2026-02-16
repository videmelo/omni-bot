import { useEffect, useState } from 'react';
import Vibrant from 'node-vibrant';
import { usePlayer, Palette } from '../contexts/PlayerContext.js';

export default function Page() {
  const { state } = usePlayer();
  const { track, next, palette, cover } = state;
  const [artist, setArtist] = useState<Palette | null>(null);
  useEffect(() => {
    if (!track?.artist.icon) return;
    const dark = new Vibrant(track.artist.icon);
    void dark.getPalette().then((colors) => {
      setArtist({
        alpha: '0', // alpha is required by Palette, setting dummy
        ...colors,
      } as unknown as Palette);
    });
  }, [track]);

  if (!track || !palette || !cover)
    return (
      <main>
        <div></div>
      </main>
    );

  return (
    <main
      className="w-full h-full scroll flex p-6 gap-3 overflow-auto scrollbar-none justify-center"
      style={{ backgroundColor: palette?.Vibrant?.hex }}
    >
      <div className="container">
        <div className="flex flex-col gap-4 w-full h-full">
          <div className={`scrollbar-none w-full h-full flex-col flex rounded-3xl`}>
            <div className={`flex flex-col items-center w-full min-w-0 duration-700 mb-9`}>
              <img
                src={track.icon}
                className="max-w-[600px] w-full h-full max-h-[600px] hover:scale-[1.02] cursor-pointer transition-all duration-200 shadow-xl shadow-[#00000023] object-cover rounded-3xl"
              />
              <div className="flex flex-col gap-1 items-center w-full min-w-0 p-8 justify-between">
                <div className="font-semibold text-center w-full text-3xl truncate font-poppins">
                  {track.name}
                </div>
                <div className="font-normal text-2xl font-poppins">{track.artist.name}</div>
              </div>
            </div>
            <div className="flex bg-[#1a1a1a] max-xl:flex-col-reverse gap-5 rounded-3xl p-6 mt-0 -m-7">
              <div className="flex flex-col max-xl:max-w-full max-w-[455px] flex-auto gap-5">
                <h1 className="text-3xl font-poppins font-semibold">Related</h1>

                <div className="flex gap-5 max-xl:flex-row flex-col min-w-0 w-full">
                  <div className="flex gap-4 flex-col">
                    <div
                      className="cursor-pointer hover:scale-[1.02] transition-all bg-black bg-opacity-50 overflow-hidden rounded-3xl"
                      style={{
                        backgroundColor: artist?.DarkVibrant?.hex,
                      }}
                    >
                      <div className="relative ">
                        <img
                          className="h-full w-auto object-cover z-0"
                          src={track.artist.icon}
                          alt=""
                        />
                        <div
                          className="absolute z-10"
                          style={{
                            inset: 0,
                            backgroundImage: `linear-gradient(to bottom, transparent 5%, ${artist?.DarkVibrant?.hex} 100%)`,
                          }}
                        ></div>
                      </div>
                      <div className="flex flex-col justify-center -mt-12 z-20 p-8">
                        <span className="font-medium text-2xl z-20">{track.artist.name}</span>
                        <span className="capitalize w-fit bg-white p-[2px] px-2 rounded-md text-sm bg-opacity-10">
                          Artist
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-auto  h-fit rounded-2xl p-3 xl cursor-pointer hover:scale-[1.02] bg-black bg-opacity-60 transition-all">
                    <div className="flex w-full items-center gap-3 ">
                      <img className="h-20 w-20 rounded-xl" src={track.album?.icon} alt="" />
                      <div className="w-full min-w-0">
                        <div className="font-medium text-lg font-poppins text-white truncate">
                          {track.album?.name}
                        </div>
                        <div className="flex gap-2">
                          <span className="capitalize w-fit bg-white p-[2px] px-2 rounded-md text-sm bg-opacity-10">
                            Album
                          </span>
                          <div className="font-normal text-base font-poppins text-[#B3B3B3]">
                            {track.artist.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {track.video ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${track.video.id}?modestbranding=1&rel=0&showinfo=0&fs=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="overflow-hidden cursor-pointer hover:scale-[1.02] transition-all w-full h-64 rounded-2xl"
                    ></iframe>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-3 flex-auto">
                <h1 className="text-3xl font-poppins font-semibold">Queue</h1>
                <div className="flex flex-col gap-3 p-4 rounded-3xl cursor-pointer hover:scale-[1.02] transition-all bg-black bg-opacity-60">
                  <span className="capitalize w-fit bg-white p-[2px] px-2 rounded-md text-sm bg-opacity-10">
                    Next
                  </span>
                  <div className="flex items-center gap-3">
                    <img className="h-20 w-20 rounded-xl" src={next?.icon} alt="" />
                    <div className="w-full min-w-0">
                      <div className="font-medium text-xl font-poppins w-full text-white truncate">
                        {next?.name}
                      </div>
                      <div className="font-normal text-lg font-poppins text-[#B3B3B3]">
                        {next?.artist.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
