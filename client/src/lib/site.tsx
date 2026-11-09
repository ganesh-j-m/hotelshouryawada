import { createContext, useContext, type ReactNode } from 'react';
import { useFetch } from '../hooks/useFetch';
import type { SiteData } from './types';

interface SiteContextValue {
  site: SiteData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const SiteContext = createContext<SiteContextValue>({ site: null, loading: true, error: null, reload: () => {} });

export function SiteProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, reload } = useFetch<SiteData>('/api/public/site');
  return <SiteContext.Provider value={{ site: data, loading, error, reload }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
