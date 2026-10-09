'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { request, token, setToken } from '@/lib/api';
import type { User, Login } from '@/lib/types';
const AuthContext = createContext<{ user: User | null; loading: boolean; login: (value: Login) => void; logout: () => void }>({ user: null, loading: true, login: () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthContext);
export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => { setToken(null); setUser(null); }, []);
  useEffect(() => {
    let active = true;
    if (token()) request<User>('/user/user/info').then(value => { if (active) setUser(value); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    else setLoading(false);
    const changed = () => { if (!token()) setUser(null); };
    window.addEventListener('thirdline-auth', changed);
    return () => { active = false; window.removeEventListener('thirdline-auth', changed); };
  }, []);
  return <SWRConfig value={{ fetcher: request, errorRetryCount: 1, revalidateOnFocus: false }}><AuthContext.Provider value={{ user, loading, login: value => { setToken(value.token); setUser(value.userInfo); }, logout }}>{children}</AuthContext.Provider></SWRConfig>;
}
