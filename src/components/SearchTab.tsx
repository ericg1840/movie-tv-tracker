import { useEffect, useState } from 'react';
import { searchTitles } from '../lib/omdb';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { DiscoverGrid } from './DiscoverGrid';
import type { OmdbSearchItem } from '../types';

export function SearchTab() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'movie' | 'series' | undefined>(undefined);
  const [results, setResults] = useState<OmdbSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { titles, addByImdbId } = useTitles();
  const { openSearch } = useDetail();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        setResults(await searchTitles(q, type));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [query, type]);

  const addedIds = new Set(titles.map((t) => t.imdb_id));

  async function handleAdd(imdbId: string) {
    setAddingId(imdbId);
    try {
      await addByImdbId(imdbId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add title');
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Find a movie or show
      </h1>

      <div className="flex flex-col gap-3 md:max-w-2xl">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title..."
          autoCapitalize="none"
          className="w-full rounded-2xl border border-black/5 bg-white px-4 py-3 text-base shadow-sm outline-none ring-1 ring-black/[0.02] focus:border-purple-400 dark:border-white/5 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-white/[0.02]"
        />

        <div className="flex gap-2 text-sm">
          {(
            [
              [undefined, 'All'],
              ['movie', 'Movies'],
              ['series', 'TV'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={label}
              onClick={() => setType(value)}
              className={`rounded-full px-3 py-1 font-medium ${
                type === value
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {query.trim().length < 2 && <DiscoverGrid type={type} />}

      {loading && <p className="text-sm text-neutral-500">Searching...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
        <p className="text-sm text-neutral-500">No results.</p>
      )}

      <div className="flex flex-col gap-2 md:max-w-2xl">
        {results.map((r) => {
          const added = addedIds.has(r.imdbID);
          return (
            <div
              key={r.imdbID}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-2.5 shadow-sm ring-1 ring-black/[0.02] dark:border-white/5 dark:bg-neutral-900 dark:ring-white/[0.02]"
            >
              <button
                onClick={() => openSearch(r)}
                className="aspect-[2/3] h-16 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800"
              >
                {r.Poster && r.Poster !== 'N/A' ? (
                  <img
                    src={r.Poster}
                    alt={r.Title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg">🎬</div>
                )}
              </button>
              <button onClick={() => openSearch(r)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {r.Title}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {r.Year} · {r.Type === 'series' ? 'TV' : 'Movie'}
                </p>
              </button>
              <button
                disabled={added || addingId === r.imdbID}
                onClick={() => handleAdd(r.imdbID)}
                className="shrink-0 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-medium text-white disabled:bg-neutral-300 disabled:text-neutral-500 dark:disabled:bg-neutral-700"
              >
                {added ? 'Added ✓' : addingId === r.imdbID ? 'Adding...' : 'Add'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
