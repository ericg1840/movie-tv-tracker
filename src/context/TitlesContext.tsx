import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Status, Title } from '../types';
import {
  addTitleByImdbId,
  fetchTitles,
  refreshTitleDetails,
  removeTitle,
  updateTitleNotes,
  updateTitleRating,
  updateTitleStatus,
} from '../lib/titles';

interface TitlesContextValue {
  titles: Title[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addByImdbId: (imdbId: string) => Promise<void>;
  setStatus: (id: string, status: Status) => Promise<void>;
  setRating: (id: string, rating: number | null) => Promise<void>;
  setNotes: (id: string, notes: string | null) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refreshDetails: (id: string) => Promise<void>;
}

const TitlesContext = createContext<TitlesContextValue | null>(null);

export function TitlesProvider({ children }: { children: ReactNode }) {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTitles(await fetchTitles());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load titles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addByImdbId = useCallback(async (imdbId: string) => {
    const added = await addTitleByImdbId(imdbId);
    setTitles((prev) => [added, ...prev]);
  }, []);

  const setStatus = useCallback(async (id: string, status: Status) => {
    const updated = await updateTitleStatus(id, status);
    setTitles((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const setRating = useCallback(async (id: string, rating: number | null) => {
    const updated = await updateTitleRating(id, rating);
    setTitles((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const setNotes = useCallback(async (id: string, notes: string | null) => {
    const updated = await updateTitleNotes(id, notes);
    setTitles((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await removeTitle(id);
    setTitles((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshDetails = useCallback(
    async (id: string) => {
      const title = titles.find((t) => t.id === id);
      if (!title) return;
      const updated = await refreshTitleDetails(id, title.imdb_id);
      setTitles((prev) => prev.map((t) => (t.id === id ? updated : t)));
    },
    [titles],
  );

  return (
    <TitlesContext.Provider
      value={{
        titles,
        loading,
        error,
        refresh,
        addByImdbId,
        setStatus,
        setRating,
        setNotes,
        remove,
        refreshDetails,
      }}
    >
      {children}
    </TitlesContext.Provider>
  );
}

export function useTitles() {
  const ctx = useContext(TitlesContext);
  if (!ctx) throw new Error('useTitles must be used within a TitlesProvider');
  return ctx;
}
