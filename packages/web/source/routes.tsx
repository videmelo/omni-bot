import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

import Layout from './layout.jsx';
import Home from './pages/Home.js';
import Search from './pages/Search.js';
import Login from './pages/Login.js';
import Queue from './pages/Queue.js';

import socket from './services/socket.js';
import { useAuth } from './contexts/AuthContext.jsx';
import Scout from './assets/icons/Scout.js';
import Collection from './pages/Collection.js';

function RedirectRoute() {
  useEffect(() => {
    const query = new URLSearchParams(location.search);

    const code = query.get('code');
    const state = query.get('state');

    if (window.opener) {
      (window.opener as Window).postMessage(
        { code, state, type: 'auth-success' },
        window.location.origin,
      );
    }
    window.close();
  }, []);

  return null;
}

const Loading = () => {
  const loginPhrases = [
    'Tuning instruments for your next hit',
    'Syncing bass with your heartbeat',
    'Loading melodies worth feeling',
    'Warming up the speakers',
    'Stacking beats one brick at a time',
    'Decoding your vibe frequency',
    'Compiling perfect chords',
    'Finding rhythm in the chaos',
    'Calibrating tempo for your session',
    'Amplifying your soul soundtrack',
    'Mixing tracks behind the scenes',
    'Spinning vinyl in the matrix',
    'Charging up your next chorus',
    'Sampling good vibes only',
    'Preloading emotional resonance',
    'Queuing up your next mood',
    'Plotting harmonic convergence',
    'Fine-tuning the groove engine',
    'Loading the heartbeat of sound',
    'Orchestrating your login anthem',
  ];
  const randomPhrase = () => loginPhrases[Math.floor(Math.random() * loginPhrases.length)];
  const [phrase, setPhrase] = useState(randomPhrase());

  useEffect(() => {
    const interval = setInterval(() => {
      setPhrase(randomPhrase());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3 items-center justify-center h-screen w-full">
      <span className="animate-bounce">
        <Scout className="w-20 h-20 rounded-full animate-spin" />
      </span>
      <span className="font-medium text-lg">Loading</span>
      <span>{phrase}...</span>
    </div>
  );
};

const Routers = () => {
  const { dispatch } = useAuth();
  const location = useLocation();

  const token = Cookies.get('auth-token');

  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      socket.emit(
        'user:set',
        token,
        (userData: { id: string; username: string; avatar: string | null }) => {
          if (!userData?.id) {
            Cookies.remove('auth-token');

            setIsLoading(false);
            setIsAuth(false);

            return dispatch({ type: 'RESET_USER' });
          }

          setIsAuth(true);
          setIsLoading(false);

          dispatch({ type: 'SET_USER', payload: userData });
        },
      );
    } else {
      setIsLoading(false);
      setIsAuth(false);
      dispatch({ type: 'RESET_USER' });
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/redirect" element={<RedirectRoute />} />
      <Route
        path="/"
        element={isLoading ? <Loading /> : isAuth ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Home />} />
        <Route path="/collection/:id" element={<Collection />} />
        <Route path="/search" element={<Search />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export { Routers, Router };
