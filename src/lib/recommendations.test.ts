import { describe, it, expect } from 'vitest';
import { pickSeeds, dedupeKey, existingKeySet, notAlreadyAdded } from './recommendations';
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
    rated: null,
    released_on: null,
    status: 'watched',
    my_rating: null,
    notes: null,
    added_at: '2026-01-01T00:00:00.000Z',
    watched_at: null,
    watched_episodes: {},
    ...overrides,
  };
}

describe('pickSeeds', () => {
  it('returns an empty list when there are no eligible titles', () => {
    expect(pickSeeds([])).toEqual([]);
  });

  it('orders rated watched titles by rating, highest first', () => {
    const low = makeTitle({ status: 'watched', my_rating: 4, title: 'Low' });
    const high = makeTitle({ status: 'watched', my_rating: 9, title: 'High' });
    const seeds = pickSeeds([low, high]);
    expect(seeds.map((t) => t.title)).toEqual(['High', 'Low']);
  });

  it('places watchlist titles between rated and unrated watched titles', () => {
    const rated = makeTitle({ status: 'watched', my_rating: 8, title: 'Rated' });
    const unrated = makeTitle({ status: 'watched', my_rating: null, title: 'Unrated' });
    const watchlist = makeTitle({ status: 'want_to_watch', title: 'Watchlist', added_at: '2026-02-01T00:00:00.000Z' });
    const seeds = pickSeeds([unrated, watchlist, rated]);
    expect(seeds.map((t) => t.title)).toEqual(['Rated', 'Watchlist', 'Unrated']);
  });

  it('sorts watchlist entries by most recently added first', () => {
    const older = makeTitle({ status: 'want_to_watch', title: 'Older', added_at: '2026-01-01T00:00:00.000Z' });
    const newer = makeTitle({ status: 'want_to_watch', title: 'Newer', added_at: '2026-02-01T00:00:00.000Z' });
    const seeds = pickSeeds([older, newer]);
    expect(seeds.map((t) => t.title)).toEqual(['Newer', 'Older']);
  });

  it('caps the result at 5 seeds', () => {
    const titles = Array.from({ length: 8 }, () => makeTitle({ status: 'watched', my_rating: 5 }));
    expect(pickSeeds(titles)).toHaveLength(5);
  });
});

describe('dedupeKey', () => {
  it('lowercases and trims the title, decoding entities', () => {
    expect(dedupeKey(' D&amp;Arcy ', '2020')).toBe("d&arcy|2020");
  });

  it('uses an empty string for a null year', () => {
    expect(dedupeKey('Movie', null)).toBe('movie|');
  });
});

describe('existingKeySet / notAlreadyAdded', () => {
  it('flags items already present in the titles list', () => {
    const titles = [makeTitle({ title: 'The Matrix', year: '1999' })];
    const keys = existingKeySet(titles);
    const keep = notAlreadyAdded(keys);
    expect(
      keep({ id: 1, media_type: 'movie', title: 'The Matrix', year: '1999', poster_path: null, rating: null }),
    ).toBe(false);
    expect(
      keep({ id: 2, media_type: 'movie', title: 'Inception', year: '2010', poster_path: null, rating: null }),
    ).toBe(true);
  });
});
