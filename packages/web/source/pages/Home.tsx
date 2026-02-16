import { useEffect, useState } from 'react';
import Play from '../assets/icons/Play.js';
import socket from '../services/socket.js';
import Vibrant from 'node-vibrant';
import Playing from '../assets/icons/Playing.js';

interface Radio {
  id: number;
  name: string;
  genre: { id: number };
  queue: { current: { icon: string; name: string; artist: { name: string } } };
  color?: string;
}

const SkeletonRadioCard = () => (
  <li className="flex animate-pulse flex-auto shrink-0 overflow-hidden bg-white bg-opacity-5 rounded-3xl">
    <div className="flex bg-white opacity-5 flex-auto shrink-0 relative items-center transition-transform justify-center flex-col h-72 w-72 rounded-lg"></div>
    <div className="flex flex-col p-5 min-w-0">
      <button className="flex shrink-0 mt-auto opacity-5 items-center justify-center rounded-full h-fit w-fit p-2 bg-white transition-all">
        <div className="h-[42px] w-[42px]"></div>
      </button>
    </div>
  </li>
);

export default function Page() {
  const [radios, setRadios] = useState<Radio[]>();

  useEffect(() => {
    socket.emit('radios:get', (data: Radio[]) => {
      void (async () => {
        const radiosWithColors = await Promise.all(
          data.map(async (radio) => {
            return {
              ...radio,
              color: await color(radio.queue.current.icon),
            };
          }),
        );
        setRadios(radiosWithColors);
      })();
    });
  }, []);

  async function color(image: string) {
    if (!image) return;
    const vibrant = new Vibrant(image);
    return (await vibrant.getPalette()).Vibrant?.getHex();
  }

  return (
    <main className="w-full p-8 gap-8 flex flex-col">
      <div className="flex w-full cursor-pointer hover:scale-[1.01] transition-all duration-300 items-center p-8 h-fit rounded-3xl bg-[#91d7e0]">
        <div className="flex flex-col whitespace-nowrap w-full gap-3 justify-between">
          <span className="bg-white bg-opacity-30 w-fit px-1 rounded-sm">Feature</span>
          <h1 className="font-poppins uppercase font-bold text-5xl ">
            Listen Omni <br /> Radio
          </h1>
          <p>Discover new sounds and enjoy the vibe.</p>
          <button className="bg-white hover:bg-opacity-40 bg-opacity-30 gap-2 py-1 px-4 items-center rounded-xl flex w-fit">
            <Play className="fill-white" />
            <span className="text-xl uppercase font-medium">Play Now</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="flex items-center shrink-0 font-medium text-2xl text capitalize">
          Radios
        </span>
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {radios
            ? radios.map((radio) => (
                <li
                  className="flex flex-auto hover:bg-opacity-5 hover:scale-[1.02] transition-all duration-300 cursor-pointer shrink-0 overflow-hidden bg-[#ffffff2d] bg-opacity-10 rounded-3xl"
                  key={radio.id}
                  style={{ backgroundColor: `${radio.color}2d` }}
                  onClick={() => {
                    socket.emit('radio:join', radio.id);
                  }}
                >
                  <div
                    className="flex flex-auto shrink-0 relative items-center transition-transform justify-center flex-col h-72 w-72 rounded-lg"
                    style={{ backgroundColor: radio.color }}
                  >
                    <span className="mb-1 font-poppins text-lg font-semibold">{radio.name}</span>
                    <div className=" my-1 flex items-center justify-center w-[130px] h-[130px]">
                      <img
                        className="h-[115px] w-[115px] cursor-pointer shadow-xl shadow-[#0000004d] transition-all hover:scale-110 -z-0 duration-200 hover:rotate-3 rounded-md object-cover"
                        src={radio.queue?.current?.icon}
                      />
                    </div>
                    <span className="font-bold max-w-[175px] truncate">
                      {radio.queue?.current?.name}
                    </span>
                    <span className="max-w-[175px] truncate">
                      {radio.queue?.current?.artist.name}
                    </span>
                    <div className="flex absolute right-3 bottom-3 capitalize whitespace-nowrap min-w-0 bg-white items-center px-[6px] rounded-md text-sm bg-opacity-20">
                      <Playing className="fill-white shrink-0 w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex flex-col p-5 min-w-0">
                    <button className="flex hover:opacity-80 shrink-0 mt-auto items-center justify-center rounded-full h-fit w-fit p-2 bg-white transition-all">
                      <Play />
                    </button>
                  </div>
                </li>
              ))
            : Array.from({ length: 8 }).map((n, i) => <SkeletonRadioCard key={i} />)}
        </ul>
      </div>
    </main>
  );
}
