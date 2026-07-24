import type { OmdbDetail, OmdbSearchItem } from '../types';

const apiKey = import.meta.env.VITE_OMDB_API_KEY;
const BASE_URL = 'https://www.omdbapi.com/';

if (!apiKey) {
  throw new Error(
    'Missing VITE_OMDB_API_KEY. Copy .env.example to .env and fill it in.',
  );
}

interface OmdbSearchResponse {
  Search?: OmdbSearchItem[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

export async function searchTitles(
  query: string,
  type?: 'movie' | 'series',
): Promise<OmdbSearchItem[]> {
  const params = new URLSearchParams({ apikey: apiKey, s: query });
  if (type) params.set('type', type);

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  const data: OmdbSearchResponse = await res.json();

  if (data.Response === 'False') {
    if (data.Error === 'Movie not found!') return [];
    throw new Error(data.Error ?? 'OMDB search failed');
  }
  return data.Search ?? [];
}

export async function getTitleDetail(imdbId: string): Promise<OmdbDetail> {
  const params = new URLSearchParams({ apikey: apiKey, i: imdbId, plot: 'short' });
  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  const data: OmdbDetail = await res.json();

  if (data.Response === 'False') {
    throw new Error(data.Error ?? 'OMDB lookup failed');
  }
  return data;
}

/** OMDB dates look like "23 Jul 2026" or "N/A" -> returns an ISO yyyy-mm-dd or null. */
export function parseOmdbDate(released: string | undefined): string | null {
  if (!released || released === 'N/A') return null;
  const parsed = new Date(released);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}
