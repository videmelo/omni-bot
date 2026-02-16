import { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';

export interface Track {
  name: string;
  id: string;
  duration: number;
  album?: { name: string; icon: string };
  artist: { name: string; icon: string };
  icon: string;
  metadata: Record<string, unknown>;
  video?: { id: string };
}

interface Swatch {
  hex: string;
  rgb: [number, number, number];
}

export interface Palette {
  alpha: string;
  Vibrant?: Swatch;
  Muted?: Swatch;
  DarkVibrant?: Swatch;
  DarkMuted?: Swatch;
  LightVibrant?: Swatch;
  LightMuted?: Swatch;
}

type RepeatMode = 'off' | 'track' | 'queue';

interface PlayerState {
  queue: Track[];
  next: Track | null;
  track: Track | null;
  cover: string | null;
  palette: Palette | null;
  timer: number;
  playing: boolean;
  paused: boolean;
  repeat: RepeatMode;
  shuffled: boolean;
  volume: number;
  voice: string | null;
}

const initialState: PlayerState = {
  queue: [],
  track: null,
  next: null,
  cover: null,
  palette: null,
  timer: 0,
  playing: false,
  paused: false,
  repeat: 'off',
  shuffled: false,
  volume: 100,
  voice: null,
};

type PlayerAction =
  | { type: 'SET_QUEUE'; payload: Track[] }
  | { type: 'SET_TRACK'; payload: Track | null }
  | { type: 'SET_NEXT'; payload: Track | null }
  | { type: 'SET_COVER'; payload: string | null }
  | { type: 'SET_PALETTE'; payload: Palette | null }
  | { type: 'SET_TIMER'; payload: number }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_REPEAT'; payload: RepeatMode }
  | { type: 'SET_SHUFFLED'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_VOICE'; payload: string | null }
  | { type: 'RESET' };

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'SET_TRACK':
      return { ...state, track: action.payload };
    case 'SET_NEXT':
      return { ...state, next: action.payload };
    case 'SET_COVER':
      return { ...state, cover: action.payload };
    case 'SET_PALETTE':
      return { ...state, palette: action.payload };
    case 'SET_TIMER':
      return { ...state, timer: action.payload };
    case 'SET_PLAYING':
      return { ...state, playing: action.payload };
    case 'SET_PAUSED':
      return { ...state, paused: action.payload };
    case 'SET_REPEAT':
      return { ...state, repeat: action.payload };
    case 'SET_SHUFFLED':
      return { ...state, shuffled: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_VOICE':
      return { ...state, voice: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface PlayerContextType {
  state: PlayerState;
  dispatch: Dispatch<PlayerAction>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  return <PlayerContext.Provider value={{ state, dispatch }}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}
