import { useMemo } from 'react';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { decodeEntities } from '../lib/text';
import { todayIso } from '../lib/dates';
import type { Title } from '../types';

function parseRuntimeMinutes(runtime: string | null): number {
  if (!runtime) return 0;
  const match = runtime.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

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

  const stats = useMemo(() => {
    const watched = titles.filter((t) => t.status === 'watched');
    const currentYear = new Date().getFullYear();
    const watchedThisYear = watched.filter(
      (t) => t.watched_at && new Date(t.watched_at).getFullYear() === currentYear,
    );
    const watchingCount = titles.filter((t) => t.status === 'watching').length;
    const backlog = titles.filter((t) => t.status === 'want_to_watch');
    const backlogCount = backlog.length;
    // Series' Runtime is typically per-episode, not the whole show, so a
    // total-time estimate only makes sense for movies.
    const backlogMovieMinutes = backlog
      .filter((t) => t.media_type === 'movie')
      .reduce((s, t) => s + parseRuntimeMinutes(t.runtime), 0);
    const backlogMovieHours = backlogMovieMinutes / 60;

    const rated = watched.filter((t): t is Title & { my_rating: number } => t.my_rating != null);
    const avgRating = rated.length > 0 ? rated.reduce((s, t) => s + t.my_rating, 0) / rated.length : null;

    const movies = watched.filter((t) => t.media_type === 'movie');
    const series = watched.filter((t) => t.media_type === 'series');
    const movieMinutes = movies.reduce((s, t) => s + parseRuntimeMinutes(t.runtime), 0);

    const genreCounts = new Map<string, number>();
    for (const t of watched) {
      if (!t.genre) continue;
      for (const g of decodeEntities(t.genre).split(',').map((s) => s.trim()).filter(Boolean)) {
        genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
      }
    }
    const topGenres = Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const topRated = rated.length > 0 ? rated.reduce((a, b) => (b.my_rating > a.my_rating ? b : a)) : null;

    return {
      watchedCount: watched.length,
      watchedThisYearCount: watchedThisYear.length,
      watchingCount,
      backlogCount,
      backlogMovieHours,
      avgRating,
      ratedCount: rated.length,
      movieCount: movies.length,
      seriesCount: series.length,
      movieHours: movieMinutes / 60,
      topGenres,
      topRated,
    };
  }, [titles]);

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

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold text-neutral-100">Stats</h1>

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
        <>
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

          {stats.topRated && (
            <button
              onClick={() => openStored(stats.topRated!)}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-neutral-900 p-3 text-left shadow-sm ring-1 ring-white/[0.02] transition-shadow hover:shadow-md"
            >
              <div className="aspect-[2/3] h-20 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
                {stats.topRated.poster_url && (
                  <img
                    src={stats.topRated.poster_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs font-medium text-neutral-400">
                  Your top rated
                </span>
                <span className="truncate text-sm font-semibold text-neutral-100">
                  {decodeEntities(stats.topRated.title)}
                </span>
                <span className="text-xs text-neutral-400">
                  ⭐ {stats.topRated.my_rating}/10
                </span>
              </div>
            </button>
          )}
        </>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-neutral-900 p-4 shadow-sm ring-1 ring-white/[0.02]">
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
