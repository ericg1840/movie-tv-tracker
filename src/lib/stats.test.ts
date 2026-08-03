import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeStats, computeMonthStats, parseRuntimeMinutes } from './stats';
import type { Title } from '../types';

let nextId = 0;

function makeTitle(overrides: Partial<Title> = {}): Title {
  nextId += 1;
  return {
    id: `id-${nextId}`,
    imdb_id: `tt${nextId}`,
    title: `Title ${nextId}`,
    media_type: 'movie',
    year: '2020',
    poster_url: null,
    plot: null,
    director: null,
    actors: null,
    genre: null,
    runtime: null,
    imdb_rating: null,
    released_on: null,
    status: 'watched',
    my_rating: null,
    notes: null,
    added_at: '2026-01-01T00:00:00.000Z',
    watched_at: null,
    ...overrides,
  };
}

describe('parseRuntimeMinutes', () => {
  it('returns 0 for null', () => {
    expect(parseRuntimeMinutes(null)).toBe(0);
  });

  it('extracts the leading number from an OMDb runtime string', () => {
    expect(parseRuntimeMinutes('136 min')).toBe(136);
  });

  it('returns 0 when there is no number in the string', () => {
    expect(parseRuntimeMinutes('N/A')).toBe(0);
  });
});

describe('computeStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-03T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zeroed-out stats for an empty list', () => {
    const stats = computeStats([]);
    expect(stats.watchedCount).toBe(0);
    expect(stats.watchingCount).toBe(0);
    expect(stats.backlogCount).toBe(0);
    expect(stats.avgRating).toBeNull();
    expect(stats.topRated).toBeNull();
    expect(stats.topGenres).toEqual([]);
  });

  it('counts titles by status', () => {
    const titles = [
      makeTitle({ status: 'watched' }),
      makeTitle({ status: 'watched' }),
      makeTitle({ status: 'watching' }),
      makeTitle({ status: 'want_to_watch' }),
    ];
    const stats = computeStats(titles);
    expect(stats.watchedCount).toBe(2);
    expect(stats.watchingCount).toBe(1);
    expect(stats.backlogCount).toBe(1);
  });

  it('only counts watched titles with a watched_at in the current year', () => {
    const titles = [
      makeTitle({ status: 'watched', watched_at: '2026-06-01T00:00:00.000Z' }),
      makeTitle({ status: 'watched', watched_at: '2025-06-01T00:00:00.000Z' }),
      makeTitle({ status: 'watched', watched_at: null }),
    ];
    expect(computeStats(titles).watchedThisYearCount).toBe(1);
  });

  it('sums backlog movie runtimes but ignores series', () => {
    const titles = [
      makeTitle({ status: 'want_to_watch', media_type: 'movie', runtime: '90 min' }),
      makeTitle({ status: 'want_to_watch', media_type: 'movie', runtime: '150 min' }),
      makeTitle({ status: 'want_to_watch', media_type: 'series', runtime: '45 min' }),
    ];
    expect(computeStats(titles).backlogMovieHours).toBeCloseTo(4, 5);
  });

  it('averages ratings only across rated watched titles', () => {
    const titles = [
      makeTitle({ status: 'watched', my_rating: 8 }),
      makeTitle({ status: 'watched', my_rating: 4 }),
      makeTitle({ status: 'watched', my_rating: null }),
    ];
    const stats = computeStats(titles);
    expect(stats.avgRating).toBe(6);
    expect(stats.ratedCount).toBe(2);
  });

  it('splits watched movie/series counts and only counts movie hours', () => {
    const titles = [
      makeTitle({ status: 'watched', media_type: 'movie', runtime: '120 min' }),
      makeTitle({ status: 'watched', media_type: 'series', runtime: '45 min' }),
    ];
    const stats = computeStats(titles);
    expect(stats.movieCount).toBe(1);
    expect(stats.seriesCount).toBe(1);
    expect(stats.movieHours).toBeCloseTo(2, 5);
  });

  it('tallies genres across watched titles and sorts descending, capped at 6', () => {
    const titles = [
      makeTitle({ status: 'watched', genre: 'Action, Sci-Fi' }),
      makeTitle({ status: 'watched', genre: 'Action, Drama' }),
      makeTitle({ status: 'watched', genre: 'Comedy, Drama, Horror, Romance, Thriller, Fantasy, Mystery' }),
    ];
    const stats = computeStats(titles);
    expect(stats.topGenres[0]).toEqual(['Action', 2]);
    expect(stats.topGenres.length).toBeLessThanOrEqual(6);
  });

  it('decodes HTML entities in genre names before tallying', () => {
    const titles = [makeTitle({ status: 'watched', genre: 'Rock &amp; Roll' })];
    expect(computeStats(titles).topGenres).toEqual([['Rock & Roll', 1]]);
  });

  it('picks the highest-rated watched title as topRated', () => {
    const best = makeTitle({ status: 'watched', my_rating: 9, title: 'Best' });
    const titles = [makeTitle({ status: 'watched', my_rating: 5 }), best];
    expect(computeStats(titles).topRated?.title).toBe('Best');
  });
});

describe('computeMonthStats', () => {
  const now = new Date('2026-08-15T00:00:00Z');

  it('returns zeroed-out stats for an empty list', () => {
    const stats = computeMonthStats([], now);
    expect(stats).toEqual({ watchedCount: 0, avgRating: null });
  });

  it('only counts titles watched in the given month/year', () => {
    const titles = [
      makeTitle({ status: 'watched', watched_at: '2026-08-01T00:00:00.000Z' }),
      makeTitle({ status: 'watched', watched_at: '2026-08-31T00:00:00.000Z' }),
      makeTitle({ status: 'watched', watched_at: '2026-07-31T00:00:00.000Z' }),
      makeTitle({ status: 'watched', watched_at: '2025-08-15T00:00:00.000Z' }),
      makeTitle({ status: 'want_to_watch', watched_at: null }),
    ];
    expect(computeMonthStats(titles, now).watchedCount).toBe(2);
  });

  it('averages ratings only across rated titles watched that month', () => {
    const titles = [
      makeTitle({ status: 'watched', watched_at: '2026-08-01T00:00:00.000Z', my_rating: 6 }),
      makeTitle({ status: 'watched', watched_at: '2026-08-02T00:00:00.000Z', my_rating: 10 }),
      makeTitle({ status: 'watched', watched_at: '2026-08-03T00:00:00.000Z', my_rating: null }),
      makeTitle({ status: 'watched', watched_at: '2026-07-01T00:00:00.000Z', my_rating: 1 }),
    ];
    expect(computeMonthStats(titles, now).avgRating).toBe(8);
  });

  it('defaults to the current date when none is given', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T00:00:00Z'));
    const titles = [makeTitle({ status: 'watched', watched_at: '2026-03-05T00:00:00.000Z' })];
    expect(computeMonthStats(titles).watchedCount).toBe(1);
    vi.useRealTimers();
  });
});
