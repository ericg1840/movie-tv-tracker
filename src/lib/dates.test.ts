import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { todayIso, formatDate, daysUntil } from './dates';

describe('todayIso', () => {
  it('returns an ISO yyyy-mm-dd string for the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-03T15:42:00Z'));
    expect(todayIso()).toBe('2026-08-03');
    vi.useRealTimers();
  });
});

describe('formatDate', () => {
  it('returns null for null input', () => {
    expect(formatDate(null)).toBeNull();
  });

  it('formats an ISO date as a human-readable string', () => {
    expect(formatDate('2026-07-23')).toBe('Jul 23, 2026');
  });
});

describe('daysUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-03T15:42:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for today', () => {
    expect(daysUntil('2026-08-03')).toBe(0);
  });

  it('returns a positive count for a future date', () => {
    expect(daysUntil('2026-08-10')).toBe(7);
  });

  it('returns a negative count for a past date', () => {
    expect(daysUntil('2026-07-27')).toBe(-7);
  });
});
