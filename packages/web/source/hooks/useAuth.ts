import { useCallback, useEffect } from 'react';

const randomString = (length = 40): string => {
  const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (x) => validChars[x % validChars.length]).join('');
};

const openPopup = (url: string): Window | null => {
  const popupHeight = 800;
  const popupWidth = 1000;
  const top = window.outerHeight / 2 + window.screenY - popupHeight / 2;
  const left = window.outerWidth / 2 + window.screenX - popupWidth / 2;

  return window.open(
    url,
    'OAuth2 Popup',
    `height=${popupHeight},width=${popupWidth},top=${top},left=${left}`,
  );
};

type AuthType = 'login' | 'invite';

interface AuthParams {
  authUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  guildId?: string;
  state?: string;
  auth?: AuthType;
}

const getAuthUrl = ({
  authUrl,
  clientId,
  redirectUri,
  scopes,
  guildId,
  state,
  auth = 'login',
}: AuthParams): string => {
  const url = new URL(authUrl);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
  });

  if (auth === 'invite') {
    if (guildId) params.set('guild_id', guildId);
    params.set('disable_guild_select', 'true');
    params.set('permissions', '8');
  } else {
    if (state) params.set('state', state);
  }

  url.search = params.toString();
  return url.toString();
};

interface UseAuthProps {
  authUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
  origin?: string;
}

export default function useAuth({
  authUrl,
  clientId,
  redirectUri,
  scopes,
  onSuccess,
  onError,
  origin,
}: UseAuthProps) {
  const getAuth = useCallback(
    (data: Partial<Omit<AuthParams, 'authUrl' | 'clientId' | 'redirectUri' | 'scopes'>> = {}) => {
      const state = randomString();
      localStorage.setItem('auth-state', state);

      const url = getAuthUrl({
        authUrl,
        clientId,
        redirectUri,
        scopes,
        state,
        ...data,
      });

      const popup = openPopup(url);

      if (!popup) {
        onError?.({ message: 'Popup blocked' });
      }
    },
    [authUrl, clientId, redirectUri, scopes, onError],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ type?: string; state?: string }>) => {
      if (origin && event.origin !== origin) return;

      if (event.data?.type === 'auth-success') {
        const state = localStorage.getItem('auth-state');
        if (state !== event.data.state) {
          console.error('OAuth2: Invalid state');
          return;
        }
        localStorage.removeItem('auth-state');
        onSuccess?.(event.data);
      } else if (event.data?.type === 'auth-error') {
        localStorage.removeItem('auth-state');
        console.error('OAuth2: Error');
        onError?.(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onError, origin]);

  return getAuth;
}
