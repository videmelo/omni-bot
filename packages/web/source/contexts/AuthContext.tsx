import { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';

interface User {
  username: string | null;
  id: string | null;
  avatar: string | null;
}

const initialState: User = {
  username: null,
  id: null,
  avatar: null,
};

type AuthAction = { type: 'SET_USER'; payload: User } | { type: 'RESET_USER' };

function authReducer(state: User, action: AuthAction): User {
  switch (action.type) {
    case 'SET_USER':
      return action.payload;
    case 'RESET_USER':
      return initialState;
    default:
      return state;
  }
}

interface AuthContextType {
  state: User;
  dispatch: Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
