import { describe, it, expect } from 'vitest';
import { parseOmdbDate } from './omdb';

describe('parseOmdbDate', () => {
  it('returns null for undefined', () => {
    expect(parseOmdbDate(undefined)).toBeNull();
  });

  it('returns null for OMDb\'s "N/A" sentinel', () => {
    expect(parseOmdbDate('N/A')).toBeNull();
  });

  it('returns null for an unparseable date', () => {
    expect(parseOmdbDate('not a date')).toBeNull();
  });

  it('converts an OMDb-formatted date to ISO yyyy-mm-dd', () => {
    expect(parseOmdbDate('23 Jul 2026')).toBe('2026-07-23');
  });
});
