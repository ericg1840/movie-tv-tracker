import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OmdbDetail } from '../types';

vi.mock('./supabase', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('./omdb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./omdb')>();
  return { ...actual, getTitleDetail: vi.fn() };
});

import { supabase } from './supabase';
import { getTitleDetail } from './omdb';
import {
  fetchTitles,
  addTitleByImdbId,
  updateTitleStatus,
  updateTitleRating,
  removeTitle,
} from './titles';

// Mimics supabase-js's query builder: every chain method returns the same
// object, and it resolves to `result` whether awaited directly (e.g. after
// .eq() for a delete) or after a terminal .single().
function mockQueryBuilder(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'order', 'insert', 'update', 'delete', 'eq']) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (r: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

const fromMock = vi.mocked(supabase.from);
const getTitleDetailMock = vi.mocked(getTitleDetail);

beforeEach(() => {
  fromMock.mockReset();
  getTitleDetailMock.mockReset();
});

describe('fetchTitles', () => {
  it('returns the rows on success', async () => {
    fromMock.mockReturnValue(mockQueryBuilder({ data: [{ id: '1' }], error: null }) as never);
    expect(await fetchTitles()).toEqual([{ id: '1', watched_episodes: {}, rated: null }]);
  });

  it('returns an empty array when data is null', async () => {
    fromMock.mockReturnValue(mockQueryBuilder({ data: null, error: null }) as never);
    expect(await fetchTitles()).toEqual([]);
  });

  it('throws the supabase error', async () => {
    fromMock.mockReturnValue(mockQueryBuilder({ data: null, error: new Error('boom') }) as never);
    await expect(fetchTitles()).rejects.toThrow('boom');
  });
});

describe('addTitleByImdbId', () => {
  it('inserts a title built from the OMDb detail', async () => {
    getTitleDetailMock.mockResolvedValue({
      imdbID: 'tt1',
      Title: 'A',
      Year: '2020',
      Type: 'movie',
      Poster: 'N/A',
      Plot: 'N/A',
      Director: 'N/A',
      Actors: 'N/A',
      Genre: 'N/A',
      Runtime: 'N/A',
      imdbRating: 'N/A',
      Rated: 'N/A',
      Released: 'N/A',
      Response: 'True',
    } satisfies OmdbDetail);
    fromMock.mockReturnValue(mockQueryBuilder({ data: { id: '1' }, error: null }) as never);

    const result = await addTitleByImdbId('tt1');
    expect(result).toEqual({ id: '1', watched_episodes: {}, rated: null });
  });

  it('translates a unique-constraint violation into a friendly error', async () => {
    getTitleDetailMock.mockResolvedValue({
      imdbID: 'tt1',
      Title: 'A',
      Year: '2020',
      Type: 'movie',
      Poster: 'N/A',
      Plot: 'N/A',
      Director: 'N/A',
      Actors: 'N/A',
      Genre: 'N/A',
      Runtime: 'N/A',
      imdbRating: 'N/A',
      Rated: 'N/A',
      Released: 'N/A',
      Response: 'True',
    } satisfies OmdbDetail);
    fromMock.mockReturnValue(
      mockQueryBuilder({ data: null, error: { code: '23505', message: 'duplicate' } }) as never,
    );

    await expect(addTitleByImdbId('tt1')).rejects.toThrow('Already in your list');
  });
});

describe('updateTitleStatus', () => {
  it('sets watched_at when marking watched', async () => {
    const builder = mockQueryBuilder({ data: { id: '1' }, error: null });
    fromMock.mockReturnValue(builder as never);

    await updateTitleStatus('1', 'watched');

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'watched', watched_at: expect.any(String) }),
    );
  });

  it('clears watched_at when moving back to want_to_watch', async () => {
    const builder = mockQueryBuilder({ data: { id: '1' }, error: null });
    fromMock.mockReturnValue(builder as never);

    await updateTitleStatus('1', 'want_to_watch');

    expect(builder.update).toHaveBeenCalledWith({ status: 'want_to_watch', watched_at: null });
  });

  it('leaves watched_at untouched for "watching"', async () => {
    const builder = mockQueryBuilder({ data: { id: '1' }, error: null });
    fromMock.mockReturnValue(builder as never);

    await updateTitleStatus('1', 'watching');

    expect(builder.update).toHaveBeenCalledWith({ status: 'watching' });
  });
});

describe('updateTitleRating', () => {
  it('propagates supabase errors', async () => {
    fromMock.mockReturnValue(mockQueryBuilder({ data: null, error: new Error('nope') }) as never);
    await expect(updateTitleRating('1', 8)).rejects.toThrow('nope');
  });
});

describe('removeTitle', () => {
  it('resolves when the delete succeeds', async () => {
    fromMock.mockReturnValue(mockQueryBuilder({ error: null }) as never);
    await expect(removeTitle('1')).resolves.toBeUndefined();
  });

  it('throws when the delete fails', async () => {
    fromMock.mockReturnValue(mockQueryBuilder({ error: new Error('denied') }) as never);
    await expect(removeTitle('1')).rejects.toThrow('denied');
  });
});
