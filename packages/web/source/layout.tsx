import { Outlet } from 'react-router-dom';

import Sidebar from './components/Sidebar.js';
import Player from './components/Player.js';
import Header from './components/Header.js';
import { useEffect, useState } from 'react';
import socket from './services/socket.js';

import Status, { StatusSeed } from './components/Status.js';

export default function RootLayout() {
  const [status, setStatus] = useState<StatusSeed | null>(null);

  useEffect(() => {
    socket.on('status', (item: StatusSeed) => {
      setStatus({ ...item });
    });
  }, []);

  return (
    <div className="main overflow-hidden scrollbar-none min-w-[1024px]">
      <Header />
      <div className="flex w-full min-w-0 p-[15px] pl-0 gap-[15px] h-[calc(100vh-65px)] max-h-[calc(100vh-65px)]">
        <Sidebar />
        <div className="relative min-w-0 w-full flex flex-col gap-3">
          <div className="min-w-0 w-full box-border overflow-auto scrollbar-none h-full bg-opacity-10 flex-col items-center flex rounded-3xl bg-white">
            <Outlet />
          </div>
          <Status
            status={status}
            styles="absolute right-1/2 left-1/2 bottom-6"
            hidden={'opacity-0'}
            visible={'opacity-100'}
          />
        </div>
        <Player />
      </div>
    </div>
  );
}
