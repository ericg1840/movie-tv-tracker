import { useMemo, useState } from 'react';
import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { TitleCard } from './TitleCard';

export interface SortOption {
  label: string;
  fn: (a: Title, b: Title) => number;
}

export function ListTab({
  heading,
  emptyMessage,
  filter,
  sortOptions,
}: {
  heading: string;
  emptyMessage: string;
  filter: (title: Title) => boolean;
  sortOptions: SortOption[];
}) {
  const { titles, loading, error, refresh } = useTitles();
  const [sortIndex, setSortIndex] = useState(0);
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [genreFilter, setGenreFilter] = useState('all');

  const baseItems = useMemo(() => titles.filter(filter), [titles, filter]);

  const genres = useMemo(
    () =>
      Array.from(
        new Set(
          baseItems.flatMap((t) => (t.genre ? t.genre.split(',').map((g) => g.trim()) : [])),
        ),
      ).sort(),
    [baseItems],
  );

  const items = useMemo(() => {
    return baseItems
      .filter((t) => typeFilter === 'all' || t.media_type === typeFilter)
      .filter((t) => genreFilter === 'all' || (t.genre ?? '').includes(genreFilter))
      .sort(sortOptions[sortIndex]?.fn);
  }, [baseItems, typeFilter, genreFilter, sortIndex, sortOptions]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {heading}
        </h1>
        <button
          onClick={() => refresh()}
          aria-label="Refresh"
          className="text-neutral-400 hover:text-brand-700"
        >
          ↻
        </button>
      </div>

      {baseItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={sortIndex}
            onChange={(e) => setSortIndex(Number(e.target.value))}
            className="rounded-full border border-black/5 bg-white px-3 py-1.5 font-medium text-neutral-600 shadow-sm ring-1 ring-black/[0.02] dark:border-white/5 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/[0.02]"
          >
            {sortOptions.map((opt, i) => (
              <option key={opt.label} value={i}>
                Sort: {opt.label}
              </option>
            ))}
          </select>

          <div className="flex gap-1.5">
            {(
              [
                ['all', 'All'],
                ['movie', 'Movies'],
                ['series', 'TV'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={`rounded-full px-3 py-1.5 font-medium ${
                  typeFilter === value
                    ? 'bg-brand-700 text-white'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {genres.length > 1 && (
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="rounded-full border border-black/5 bg-white px-3 py-1.5 font-medium text-neutral-600 shadow-sm ring-1 ring-black/[0.02] dark:border-white/5 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-white/[0.02]"
            >
              <option value="all">All genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading && titles.length === 0 && <p className="text-sm text-neutral-500">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && baseItems.length === 0 && (
        <p className="text-sm text-neutral-500">{emptyMessage}</p>
      )}
      {!loading && baseItems.length > 0 && items.length === 0 && (
        <p className="text-sm text-neutral-500">Nothing matches those filters.</p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((title) => (
          <TitleCard key={title.id} title={title} />
        ))}
      </div>
    </div>
  );
}
