import { decodeEntities } from './text';
import type { Title } from '../types';
import type { TrendingItem } from './tmdb';

const MAX_SEEDS = 5;

/**
 * Picks titles to seed "similar titles" lookups from: rated watched titles
 * first (strongest taste signal), then the watchlist (incl. upcoming
 * releases, which are just watchlist items with a future released_on), then
 * unrated watched titles.
 */
export function pickSeeds(titles: Title[]): Title[] {
  const watched = titles.filter((t) => t.status === 'watched');
  const rated = watched
    .filter((t) => t.my_rating != null)
    .sort((a, b) => (b.my_rating ?? 0) - (a.my_rating ?? 0));
  const unrated = watched.filter((t) => t.my_rating == null);
  const watchlist = titles
    .filter((t) => t.status === 'want_to_watch' || t.status === 'watching')
    .sort((a, b) => b.added_at.localeCompare(a.added_at));
  return [...rated, ...watchlist, ...unrated].slice(0, MAX_SEEDS);
}

/**
 * Titles to pull directors/cast from for "Because you loved [person]" rows —
 * just the highest-rated watched titles, since a low rating isn't a signal
 * you want more from whoever made it.
 */
export function pickTopRatedTitles(titles: Title[], limit = 2): Title[] {
  return titles
    .filter((t) => t.status === 'watched' && t.my_rating != null)
    .sort((a, b) => (b.my_rating ?? 0) - (a.my_rating ?? 0))
    .slice(0, limit);
}

// Our titles table keys off imdb_id, but TMDB's recommendation/trending
// endpoints only return TMDB ids, so cross-referencing by id would mean an
// extra API call per result. Title+year is cheap and close enough to dedupe
// against what's already in the list.
export function dedupeKey(title: string, year: string | null): string {
  return `${decodeEntities(title).trim().toLowerCase()}|${year ?? ''}`;
}

export function existingKeySet(titles: Title[]): Set<string> {
  return new Set(titles.map((t) => dedupeKey(t.title, t.year)));
}

export function notAlreadyAdded(existingKeys: Set<string>) {
  return (item: TrendingItem) => !existingKeys.has(dedupeKey(item.title, item.year));
}
