import { useMemo } from 'react';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { decodeEntities } from '../lib/text';
import { todayIso } from '../lib/dates';
import { computeStats } from '../lib/stats';
import type { Title } from '../types';

function downloadBackup(titles: Title[]) {
  const blob = new Blob([JSON.stringify(titles, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `watchlist-backup-${todayIso()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-white/5 bg-neutral-900 p-3.5 shadow-sm ring-1 ring-white/[0.02]">
      <span className="text-2xl font-bold leading-none text-neutral-100">
        {value}
      </span>
      <span className="text-xs font-medium text-neutral-400">{label}</span>
      {sub && <span className="text-[11px] text-neutral-500">{sub}</span>}
    </div>
  );
}

function GenreBar({ genre, count, max }: { genre: string; count: number; max: number }) {
  const pct = Math.max(8, Math.round((count / max) * 100));
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-24 shrink-0 truncate text-xs font-medium text-neutral-300">
        {genre}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-800">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 shrink-0 text-right text-xs text-neutral-400">{count}</span>
    </div>
  );
}

export function StatsTab() {
  const { titles, loading } = useTitles();
  const { openStored } = useDetail();

  const stats = useMemo(() => computeStats(titles), [titles]);

  if (loading && titles.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <h1 className="text-lg font-semibold text-neutral-100">Stats</h1>
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (titles.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <h1 className="text-lg font-semibold text-neutral-100">Stats</h1>
        <p className="text-sm text-neutral-500">
          Add and watch some titles to see stats here.
        </p>
      </div>
    );
  }

  const hasSidebar = stats.watchedCount > 0 && (stats.topGenres.length > 0 || stats.topRatedList.length > 0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold text-neutral-100">Stats</h1>

      <div
        className={`grid grid-cols-1 gap-4 md:items-start ${hasSidebar ? 'md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : ''}`}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Watched" value={stats.watchedCount} />
            <StatTile label="Watched this year" value={stats.watchedThisYearCount} />
            <StatTile label="Currently watching" value={stats.watchingCount} />
            <StatTile
              label="Backlog"
              value={stats.backlogCount}
              sub={
                stats.backlogMovieHours > 0
                  ? `~${stats.backlogMovieHours >= 10 ? Math.round(stats.backlogMovieHours) : stats.backlogMovieHours.toFixed(1)}h of movies`
                  : undefined
              }
            />
          </div>

          {stats.watchedCount === 0 ? (
            <p className="text-sm text-neutral-500">
              Mark something watched to see rating and genre breakdowns.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Average rating you gave"
                value={stats.avgRating != null ? stats.avgRating.toFixed(1) : '—'}
                sub={stats.ratedCount > 0 ? `${stats.ratedCount} rated` : 'None rated yet'}
              />
              <StatTile
                label="Movie hours watched"
                value={stats.movieHours >= 10 ? Math.round(stats.movieHours) : stats.movieHours.toFixed(1)}
                sub={`${stats.movieCount} movies · ${stats.seriesCount} shows`}
              />
            </div>
          )}
        </div>

        {hasSidebar && (
          <div className="flex flex-col gap-4">
            {stats.topGenres.length > 0 && (
              <div className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-neutral-900 p-4 shadow-sm ring-1 ring-white/[0.02]">
                <h2 className="text-sm font-semibold text-neutral-100">
                  Top genres
                </h2>
                {stats.topGenres.map(([genre, count]) => (
                  <GenreBar key={genre} genre={genre} count={count} max={stats.topGenres[0][1]} />
                ))}
              </div>
            )}

            {stats.topRatedList.length > 0 && (
              <div className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-neutral-900 p-4 shadow-sm ring-1 ring-white/[0.02]">
                <h2 className="text-sm font-semibold text-neutral-100">Your top rated</h2>
                <div className="flex flex-col gap-1">
                  {stats.topRatedList.map((title, i) => (
                    <button
                      key={title.id}
                      onClick={() => openStored(title)}
                      className="flex items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-neutral-800"
                    >
                      <span className="w-4 shrink-0 text-center text-sm font-bold text-neutral-600">
                        {i + 1}
                      </span>
                      <div className="aspect-[2/3] h-12 shrink-0 overflow-hidden rounded-md bg-neutral-800">
                        {title.poster_url && (
                          <img src={title.poster_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-200">
                        {decodeEntities(title.title)}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-brand-300">
                        ⭐ {title.my_rating}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-neutral-900 p-4 shadow-sm ring-1 ring-white/[0.02] md:max-w-md">
        <h2 className="text-sm font-semibold text-neutral-100">Backup</h2>
        <p className="text-xs text-neutral-400">
          There's no login here, so everything lives in one Supabase project. Download a copy of
          your whole watchlist ({titles.length} {titles.length === 1 ? 'title' : 'titles'}) in
          case you ever need it.
        </p>
        <button
          onClick={() => downloadBackup(titles)}
          className="mt-1 self-start rounded-full bg-brand-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-800"
        >
          Download backup (.json)
        </button>
      </div>
    </div>
  );
}
