import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import { useState } from 'react';

import Discord from '../assets/icons/Discord.js';
import Scout from '../assets/icons/Scout.js';
import useAuth from '../hooks/useAuth.js';
import Status, { StatusSeed } from '../components/Status.js';
import api from '../services/axios.js';

export default function Page() {
  const [status, setStatus] = useState<StatusSeed | null>(null);

  function setAuthError() {
    setStatus({
      type: 'error',
      message: 'Error while authenticating with Discord, please try again later!',
    });
  }

  const navigate = useNavigate();
  const getAuth = useAuth({
    redirectUri: `${window.location.origin}/redirect`,
    clientId: import.meta.env.VITE_DISCORD_ID,
    authUrl: 'https://discord.com/api/oauth2/authorize',
    scopes: ['identify', 'guilds'],

    onSuccess: (data: unknown) => {
      const authData = data as { code?: string; state?: string };
      if (authData.code) {
        api
          .get<{ token: string; expires: number }>(`/auth`, {
            params: { code: authData.code, state: authData.state },
          })
          .then((res) => {
            if (!res.data?.token) return setAuthError();

            Cookies.set('auth-token', res.data.token, {
              expires: new Date(Date.now() + res.data.expires * 1000),
              path: '/',
              secure: false,
            });
            navigate('/');
            window.location.reload();
          })
          .catch(() => setAuthError());
      }
    },
    onError: () => setAuthError(),
  });

  return (
    <main className="h-screen w-full min-w-0 flex flex-col justify-center items-center bg-[#91D7E0]">
      <Scout className="w-32 h-32 shrink-0 mt-12 mb-12" />
      <div className="relative overflow-hidden w-full h-full flex flex-col items-center px-9">
        <h1 className="text-3xl font-bold mb-2 text-center relative z-10 mt-32 opacity-100 will-change-transform transform-none">
          One account, a world of music!
        </h1>
        <p className="text-lg mb-24 opacity-70 w-full text-center font-light relative z-10 will-change-transform">
          Connect with your friends and explore new tunes together.
        </p>
        <button
          className="z-10 font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 bg-[#5865F2] hover:bg-[#4752C4] w-full sm:w-auto text-white text-sm p-7 px-10 flex items-center justify-center space-x-2 rounded-2xl"
          onClick={() => getAuth()}
        >
          <Discord className="w-7 h-7 flex-shrink-0" />
          <span className="whitespace-nowrap text-xl">Sign in with Discord</span>
        </button>
        <div className="w-[200vw] h-[100vh] left-1/2 -translate-x-1/2 top-0 rounded-t-[105550%] bg-black absolute"></div>
      </div>
      <Status
        status={status}
        styles="absolute right-1/2 left-1/2 bottom-6"
        hidden={'opacity-0'}
        visible={'opacity-100'}
      />
    </main>
  );
}
