import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, get, post } from '../lib/api';
import type { SessionUser } from '../lib/types';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await get<{ user: SessionUser }>('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        console.warn('[auth] session check failed', err);
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await post<{ user: SessionUser; redirect: string }>('/api/auth/login', {
      username,
      password,
    });
    setUser(data.user);
    return data.redirect;
  }, []);

  const logout = useCallback(async () => {
    try {
      await post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
