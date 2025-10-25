import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import Home from '../assets/icons/Home.js';
import Queue from '../assets/icons/Queue.js';
import Like from '../assets/icons/Like.js';
import Feed from '../assets/icons/Feed.js';
import { useAuth } from '../contexts/AuthContext.js';

const icons = { Home, Queue, Liked: Like, Feed };

type IconName = keyof typeof icons;

const items: { name: IconName; url: string }[] = [
   { name: 'Home', url: '/' },
   { name: 'Queue', url: '/queue' },
   { name: 'Liked', url: '/liked' },
   { name: 'Feed', url: '/feed' },
];

const Sidebar = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { state: user, dispatch } = useAuth();

   return (
      <div className="flex flex-col gap-3 h-full max-h-[calc(100vh-45px)]">
         <nav className="w-[76px] p-[10px] bg-opacity-10 flex-col flex rounded-r-3xl bg-white h-full">
            {items.map(({ name, url }) => {
               const Icon = icons[name];
               return (
                  <Link
                     to={url}
                     key={name}
                     className={`flex w-[50px] mx-auto h-[50px] rounded-2xl items-center justify-center ${location.pathname === url ? 'bg-white bg-opacity-[15%] text-white' : ''}`}
                  >
                     <Icon />
                  </Link>
               );
            })}
            {user.avatar ? (
               <div className="relative flex ml-[5px] group cursor-pointer mt-auto">
                  <img
                     className="rounded-full w-[50px] h-[50px]"
                     src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                     alt="avatar"
                  />
                  <span className="p-2 block"></span>
                  <button
                     onClick={() => {
                        Cookies.remove('auth-token');
                        navigate('/login');
                        dispatch({ type: 'RESET_USER' });
                     }}
                     className="rounded-xl h-[50px] font-poppins z-50 hidden group-hover:block bg-[#2e2e2e] top-0 left-[65px] p-2 px-10"
                  >
                     Logout
                  </button>
               </div>
            ) : null}
         </nav>
      </div>
   );
};

export default Sidebar;
