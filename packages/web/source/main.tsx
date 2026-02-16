import ReactDOM from 'react-dom/client';

import { Routers, Router } from './routes.js';

import { PlayerProvider } from './contexts/PlayerContext.js';
import { AuthProvider } from './contexts/AuthContext.js';

import './styles/globals.css';

const container = document.getElementById('root')!;
const root = ReactDOM.createRoot(container);

root.render(
  <AuthProvider>
    <PlayerProvider>
      <Router>
        <Routers />
      </Router>
    </PlayerProvider>
  </AuthProvider>,
);
