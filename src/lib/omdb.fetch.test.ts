import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchTitles, getTitleDetail } from './omdb';

function mockFetchOnce(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve(body),
    }),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('searchTitles', () => {
  it('returns results with entity-decoded titles', async () => {
    mockFetchOnce({
      Response: 'True',
      Search: [{ imdbID: 'tt1', Title: "D&apos;Arcy", Year: '2020', Type: 'movie', Poster: 'N/A' }],
    });
    const results = await searchTitles('darcy');
    expect(results).toEqual([
      { imdbID: 'tt1', Title: "D'Arcy", Year: '2020', Type: 'movie', Poster: 'N/A' },
    ]);
  });

  it('returns an empty list for OMDb\'s "not found" response', async () => {
    mockFetchOnce({ Response: 'False', Error: 'Movie not found!' });
    expect(await searchTitles('asdfasdf')).toEqual([]);
  });

  it('throws for other OMDb error responses', async () => {
    mockFetchOnce({ Response: 'False', Error: 'Invalid API key!' });
    await expect(searchTitles('x')).rejects.toThrow('Invalid API key!');
  });
});

describe('getTitleDetail', () => {
  it('decodes entities across the text fields', async () => {
    mockFetchOnce({
      Response: 'True',
      imdbID: 'tt1',
      Title: 'Caf&#233;',
      Plot: 'A &amp; B',
      Director: 'X &amp; Y',
      Actors: 'A &amp; B',
      Genre: 'Drama &amp; Comedy',
      Year: '2020',
      Type: 'movie',
      Poster: 'N/A',
      Runtime: '90 min',
      imdbRating: '7.0',
      Released: '01 Jan 2020',
    });
    const detail = await getTitleDetail('tt1');
    expect(detail.Title).toBe('Café');
    expect(detail.Plot).toBe('A & B');
    expect(detail.Genre).toBe('Drama & Comedy');
  });

  it('throws when OMDb reports an error', async () => {
    mockFetchOnce({ Response: 'False', Error: 'Incorrect IMDb ID.' });
    await expect(getTitleDetail('nope')).rejects.toThrow('Incorrect IMDb ID.');
  });
});
