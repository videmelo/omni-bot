import React from 'react';
import Cookies from 'js-cookie';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Scout from '../assets/icons/Scout.js';
import Search from '../assets/icons/Search.js';

export default function Header() {
   const location = useLocation();

   const items = [
      { name: 'Home', url: '/' },
      { name: 'Queue', url: '/queue' },
      { name: 'Liked', url: '/liked' },
      { name: 'Feed', url: '/feed' },
      { name: 'Search', url: '/search' },
   ];

   const navigate = useNavigate();
   function handleSearch(value: any) {
      if (!value) return;
      navigate(`/search?q=${value}`);
   }

   return (
      <div className="flex w-full min-w-0 p-[15px] pb-0 gap-[15px] items-center">
         <Scout className="w-[50px] h-[50px] shrink-0" />
         <div className="h-[50px] w-full pl-6 flex items-center font-medium text-[32px] text">{items.map(({ name, url }) => (location.pathname === url ? name : null))}</div>
         <div className="h-[45px] w-[400px] gap-3 pl-4 p-2 flex items-center shrink-0 overflow-auto bg-opacity-5 rounded-2xl border border-white border-opacity-5 bg-white">
            <Search className="opacity-50" />
            <span className="block h-4 rounded-sm border border-white border-opacity-50 bottom-0 opacity-40" />
            <input
               type="text"
               placeholder="Search"
               className="bg-transparent text-base text-white text-opacity-50 outline-none placeholder:text-base placeholder:text-[#ffffff54] placeholder:text-opacity-80"
               autoComplete="off"
               autoCorrect="off"
               autoCapitalize="off"
               spellCheck="false"
               maxLength={250}
               onKeyUp={(event: any) => {
                  if (event.key === 'Enter') handleSearch(event.target.value);
               }}
            />
         </div>
      </div>
   );
}
