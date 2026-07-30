import { useMemo, useState } from 'react';
import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { TitleCard } from './TitleCard';
import { Icon } from './Icon';

export interface SortOption {
  label: string;
  fn: (a: Title, b: Title) => number;
}

const ROLL_DURATION_MS = 500;

export function ListTab({
  heading,
  emptyMessage,
  filter,
  sortOptions,
  randomPick = false,
}: {
  heading: string;
  emptyMessage: string;
  filter: (title: Title) => boolean;
  sortOptions: SortOption[];
  randomPick?: boolean;
}) {
  const { titles, loading, error, refresh } = useTitles();
  const { openStored } = useDetail();
  const [sortIndex, setSortIndex] = useState(0);
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [rolling, setRolling] = useState(false);

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

  function handlePick() {
    if (rolling || items.length === 0) return;
    setRolling(true);
    window.setTimeout(() => {
      setRolling(false);
      openStored(items[Math.floor(Math.random() * items.length)]);
    }, ROLL_DURATION_MS);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-100">
          {heading}
        </h1>
        <div className="flex items-center gap-2">
          {randomPick && (
            <button
              onClick={handlePick}
              disabled={rolling || items.length === 0}
              aria-label="Pick something for me"
              title="Pick something for me"
              className="flex items-center gap-1.5 rounded-full bg-brand-950/50 px-3 py-1.5 text-xs font-medium text-brand-300 transition-colors hover:bg-brand-900/60 disabled:cursor-default disabled:opacity-40"
            >
              <Icon name="dice" className={`h-4 w-4 ${rolling ? 'animate-dice-roll' : ''}`} />
              Pick for me
            </button>
          )}
          <button
            onClick={() => refresh()}
            aria-label="Refresh"
            className="text-neutral-400 hover:text-brand-700"
          >
            ↻
          </button>
        </div>
      </div>

      {baseItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={sortIndex}
            onChange={(e) => setSortIndex(Number(e.target.value))}
            className="rounded-full border border-white/5 bg-neutral-900 py-1.5 pl-3 pr-7 font-medium text-neutral-300 shadow-sm ring-1 ring-white/[0.02]"
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
                    : 'bg-neutral-800 text-neutral-300'
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
              className="rounded-full border border-white/5 bg-neutral-900 py-1.5 pl-3 pr-7 font-medium text-neutral-300 shadow-sm ring-1 ring-white/[0.02]"
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
