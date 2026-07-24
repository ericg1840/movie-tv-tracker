import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { OmdbSearchItem, Title } from '../types';
import type { TrendingItem } from '../lib/tmdb';

export type DetailTarget =
  | { kind: 'stored'; title: Title }
  | { kind: 'search'; item: OmdbSearchItem }
  | { kind: 'discover'; item: TrendingItem };

interface DetailContextValue {
  target: DetailTarget | null;
  openStored: (title: Title) => void;
  openSearch: (item: OmdbSearchItem) => void;
  openDiscover: (item: TrendingItem) => void;
  close: () => void;
}

const DetailContext = createContext<DetailContextValue | null>(null);

export function DetailProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<DetailTarget | null>(null);

  const value = useMemo<DetailContextValue>(
    () => ({
      target,
      openStored: (title) => setTarget({ kind: 'stored', title }),
      openSearch: (item) => setTarget({ kind: 'search', item }),
      openDiscover: (item) => setTarget({ kind: 'discover', item }),
      close: () => setTarget(null),
    }),
    [target],
  );

  return <DetailContext.Provider value={value}>{children}</DetailContext.Provider>;
}

export function useDetail() {
  const ctx = useContext(DetailContext);
  if (!ctx) throw new Error('useDetail must be used within a DetailProvider');
  return ctx;
}
