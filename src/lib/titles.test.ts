import { describe, it, expect } from 'vitest';
import { detailToFields } from './titles';
import type { OmdbDetail } from '../types';

const baseDetail: OmdbDetail = {
  imdbID: 'tt0133093',
  Title: 'The Matrix',
  Year: '1999',
  Type: 'movie',
  Poster: 'https://example.com/poster.jpg',
  Plot: 'A hacker learns the truth.',
  Director: 'Lana Wachowski, Lilly Wachowski',
  Actors: 'Keanu Reeves, Laurence Fishburne',
  Genre: 'Action, Sci-Fi',
  Runtime: '136 min',
  imdbRating: '8.7',
  Released: '31 Mar 1999',
  Response: 'True',
};

describe('detailToFields', () => {
  it('maps OMDb fields onto the title schema', () => {
    expect(detailToFields(baseDetail)).toEqual({
      imdb_id: 'tt0133093',
      title: 'The Matrix',
      media_type: 'movie',
      year: '1999',
      poster_url: 'https://example.com/poster.jpg',
      plot: 'A hacker learns the truth.',
      director: 'Lana Wachowski, Lilly Wachowski',
      actors: 'Keanu Reeves, Laurence Fishburne',
      genre: 'Action, Sci-Fi',
      runtime: '136 min',
      imdb_rating: '8.7',
      released_on: '1999-03-31',
    });
  });

  it('maps Type "series" to media_type "series"', () => {
    expect(detailToFields({ ...baseDetail, Type: 'series' }).media_type).toBe('series');
  });

  it('maps any non-series Type to media_type "movie"', () => {
    expect(detailToFields({ ...baseDetail, Type: 'episode' }).media_type).toBe('movie');
  });

  it('collapses OMDb\'s "N/A" sentinel to null for optional fields', () => {
    const fields = detailToFields({
      ...baseDetail,
      Poster: 'N/A',
      Plot: 'N/A',
      Director: 'N/A',
      Actors: 'N/A',
      Genre: 'N/A',
      Runtime: 'N/A',
      imdbRating: 'N/A',
    });
    expect(fields.poster_url).toBeNull();
    expect(fields.plot).toBeNull();
    expect(fields.director).toBeNull();
    expect(fields.actors).toBeNull();
    expect(fields.genre).toBeNull();
    expect(fields.runtime).toBeNull();
    expect(fields.imdb_rating).toBeNull();
  });
});
