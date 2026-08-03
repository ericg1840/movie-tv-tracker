import { decodeEntities } from './text';
import type { Title } from '../types';

export function parseRuntimeMinutes(runtime: string | null): number {
  if (!runtime) return 0;
  const match = runtime.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export interface Stats {
  watchedCount: number;
  watchedThisYearCount: number;
  watchingCount: number;
  backlogCount: number;
  backlogMovieHours: number;
  avgRating: number | null;
  ratedCount: number;
  movieCount: number;
  seriesCount: number;
  movieHours: number;
  topGenres: [string, number][];
  topRated: (Title & { my_rating: number }) | null;
  topRatedList: (Title & { my_rating: number })[];
}

export function computeStats(titles: Title[]): Stats {
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
  const topRatedList = [...rated].sort((a, b) => b.my_rating - a.my_rating).slice(0, 5);

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
    topRatedList,
  };
}

export interface MonthStats {
  watchedCount: number;
  avgRating: number | null;
}

export function computeMonthStats(titles: Title[], now: Date = new Date()): MonthStats {
  const year = now.getFullYear();
  const month = now.getMonth();
  const watchedThisMonth = titles.filter(
    (t) =>
      t.status === 'watched' &&
      t.watched_at &&
      new Date(t.watched_at).getFullYear() === year &&
      new Date(t.watched_at).getMonth() === month,
  );
  const rated = watchedThisMonth.filter((t): t is Title & { my_rating: number } => t.my_rating != null);
  const avgRating = rated.length > 0 ? rated.reduce((s, t) => s + t.my_rating, 0) / rated.length : null;

  return { watchedCount: watchedThisMonth.length, avgRating };
}
