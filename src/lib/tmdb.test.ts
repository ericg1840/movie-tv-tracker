import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTrending, getSimilarTitles, getWatchProviders, getTrailer } from './tmdb';

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}

function mockFetchSequence(...responses: unknown[]) {
  const fn = vi.fn();
  for (const r of responses) fn.mockResolvedValueOnce(r);
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('getTrending', () => {
  it('maps TMDB results to TrendingItem, deriving year from release/air date', async () => {
    mockFetchSequence(
      jsonResponse({
        results: [
          { id: 1, media_type: 'movie', title: 'Movie A', release_date: '2020-05-01', poster_path: '/a.jpg' },
          { id: 2, media_type: 'tv', name: 'Show B', first_air_date: '2019-01-01', poster_path: null },
        ],
      }),
    );
    const items = await getTrending();
    expect(items).toEqual([
      { id: 1, media_type: 'movie', title: 'Movie A', year: '2020', poster_path: '/a.jpg' },
      { id: 2, media_type: 'tv', title: 'Show B', year: '2019', poster_path: null },
    ]);
  });

  it('throws when the request fails', async () => {
    mockFetchSequence(jsonResponse({}, false));
    await expect(getTrending()).rejects.toThrow('Failed to load trending titles');
  });
});

describe('getSimilarTitles', () => {
  it('returns an empty list when the imdb id has no TMDB match', async () => {
    mockFetchSequence(jsonResponse({ movie_results: [], tv_results: [] }));
    expect(await getSimilarTitles('tt-nope')).toEqual([]);
  });

  it('returns up to 12 recommendations for a matched title', async () => {
    mockFetchSequence(
      jsonResponse({ movie_results: [{ id: 42 }], tv_results: [] }),
      jsonResponse({
        results: Array.from({ length: 20 }, (_, i) => ({
          id: i,
          title: `Rec ${i}`,
          poster_path: null,
        })),
      }),
    );
    const items = await getSimilarTitles('tt42');
    expect(items).toHaveLength(12);
    expect(items[0].media_type).toBe('movie');
  });
});

describe('getWatchProviders', () => {
  it('returns null when the region has no listing', async () => {
    mockFetchSequence(
      jsonResponse({ movie_results: [{ id: 1 }], tv_results: [] }),
      jsonResponse({ results: {} }),
    );
    expect(await getWatchProviders('tt1')).toBeNull();
  });

  it('returns the US region providers when present', async () => {
    mockFetchSequence(
      jsonResponse({ movie_results: [{ id: 1 }], tv_results: [] }),
      jsonResponse({
        results: { US: { link: 'https://example.com', flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg' }] } },
      }),
    );
    const providers = await getWatchProviders('tt1');
    expect(providers?.link).toBe('https://example.com');
    expect(providers?.flatrate?.[0].provider_name).toBe('Netflix');
  });
});

describe('getTrailer', () => {
  it('prefers an official trailer over other video types', async () => {
    mockFetchSequence(
      jsonResponse({ movie_results: [{ id: 1 }], tv_results: [] }),
      jsonResponse({
        results: [
          { key: 'teaser', name: 'Teaser', site: 'YouTube', type: 'Teaser' },
          { key: 'unofficial', name: 'Fan trailer', site: 'YouTube', type: 'Trailer', official: false },
          { key: 'official', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true },
        ],
      }),
    );
    const trailer = await getTrailer('tt1');
    expect(trailer?.key).toBe('official');
  });

  it('ignores non-YouTube videos', async () => {
    mockFetchSequence(
      jsonResponse({ movie_results: [{ id: 1 }], tv_results: [] }),
      jsonResponse({
        results: [{ key: 'v', name: 'Vimeo trailer', site: 'Vimeo', type: 'Trailer' }],
      }),
    );
    expect(await getTrailer('tt1')).toBeNull();
  });
});
