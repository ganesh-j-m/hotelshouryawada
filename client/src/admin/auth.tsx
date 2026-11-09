import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { AdminUser } from '../lib/types';

interface AuthValue {
  user: AdminUser | null;
  checking: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthValue>({ user: null, checking: true, login: async () => {}, logout: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .get<{ user: AdminUser }>('/api/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
    const onExpired = () => setUser(null);
    window.addEventListener('sw:unauthorized', onExpired);
    return () => window.removeEventListener('sw:unauthorized', onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post<{ user: AdminUser }>('/api/auth/login', { email, password });
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout').catch(() => undefined);
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, checking, login, logout }}>{children}</AuthCtx.Provider>;
}
