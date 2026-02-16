import Plus from '../assets/icons/Plus.js';

export interface SectionItem {
  id: string | number;
  name: string;
  icon?: string;
  type?: string;
  artist?: { name: string };
  artists?: { name: string }[];
}

interface SectionProps {
  title?: string;
  data?: SectionItem[];
  onClick?: (e: React.MouseEvent, item: SectionItem) => void;
  onAppend?: (e: React.MouseEvent, item: SectionItem) => void;
  rounded?: boolean;
}

export default function Section({
  title = 'Undefined',
  data,
  onClick,
  onAppend,
  rounded,
}: SectionProps) {
  if (!data?.length)
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col w-full gap-3 flex-grow">
          <div className="flex items-center shrink-0 bg-white bg-opacity-5 h-6 w-32 animate-pulse"></div>
          <div
            className="overflow-x-auto -mx-6 scrollbar-none"
            style={{
              WebkitMaskImage:
                'linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 5%, rgba(0, 0, 0, 1) 95%, rgba(0, 0, 0, 0))',
              maskImage:
                'linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 5%, rgba(0, 0, 0, 1) 95%, rgba(0, 0, 0, 0))',
            }}
          >
            <ul className="flex gap-1 mt-2 scrollbar-none flex-grow">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <li key={i} className="flex flex-col gap-1 first:ml-6 last:mr-6 p-4 rounded-md">
                  <div
                    className={`h-[140px] w-[140px] bg-white bg-opacity-5 rounded-md animate-pulse`}
                  />
                  <div className="flex flex-col gap-1 w-[140px]">
                    <div className="h-4 w-28 bg-white bg-opacity-5 animate-pulse"></div>
                    <div className=" h-4 w-10 bg-white bg-opacity-5 animate-pulse"></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col w-full flex-grow">
        <div className="flex justify-between items-center">
          <div className="flex items-center shrink-0 font-medium text-2xl text capitalize">
            {title}
          </div>
          <span className="font-poppins cursor-pointer hover:underline font-light opacity-60">
            Show All
          </span>
        </div>
        <div
          className="overflow-x-auto -mx-6 scrollbar-none"
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 5%, rgba(0, 0, 0, 1) 95%, rgba(0, 0, 0, 0))',
            maskImage:
              'linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 5%, rgba(0, 0, 0, 1) 95%, rgba(0, 0, 0, 0))',
          }}
        >
          <ul className="flex mt-2 scrollbar-none flex-grow">
            {data.map((item, index: number) => (
              <li
                key={item.id}
                className="flex cursor-pointer flex-col gap-1 first:ml-6 last:mr-6 hover:bg-white hover:bg-opacity-5 p-4 rounded-md"
                onClick={(event) => (onClick ? onClick(event, data[index]) : null)}
              >
                <div className="group flex flex-col items-end">
                  <img
                    src={item?.icon || item?.icon}
                    className={`h-[140px] w-[140px] object-cover ${rounded ? 'rounded-full' : 'rounded-md'}`}
                  />
                  {onAppend ? (
                    <button
                      className="p-2 opacity-0 cursor-pointer hover:scale-[1.03] -mt-[46px] hover:bg-opacity-100 mr-[5px] group-hover:opacity-100 group-hover:bg-black w-[41px] h-[41px] inline-block group-hover:bg-opacity-70 rounded-md"
                      onClick={(event) => onAppend(event, data[index])}
                    >
                      <Plus className="w-7 h-7" />
                    </button>
                  ) : null}
                </div>
                <div className="flex mt-2 flex-col w-[140px]">
                  <div className="font-poppins font-medium text-base truncate">{item.name}</div>
                  <div className="font-poppins font-normal text-sm text-[#B3B3B3] truncate">
                    {item.artist
                      ? item.artist.name
                      : item.artists
                        ? item.artists[0].name
                        : 'Artist'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
