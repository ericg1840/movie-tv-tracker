const apiKey = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const REGION = 'US';

if (!apiKey) {
  throw new Error(
    'Missing VITE_TMDB_API_KEY. Copy .env.example to .env and fill it in.',
  );
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export function providerLogoUrl(logoPath: string): string {
  return `https://image.tmdb.org/t/p/w92${logoPath}`;
}

async function findTmdbTarget(
  imdbId: string,
): Promise<{ id: number; mediaType: 'movie' | 'tv' } | null> {
  const res = await fetch(
    `${BASE_URL}/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.movie_results?.length) return { id: data.movie_results[0].id, mediaType: 'movie' };
  if (data.tv_results?.length) return { id: data.tv_results[0].id, mediaType: 'tv' };
  return null;
}

export async function getWatchProviders(imdbId: string): Promise<WatchProviders | null> {
  const target = await findTmdbTarget(imdbId);
  if (!target) return null;

  const res = await fetch(
    `${BASE_URL}/${target.mediaType}/${target.id}/watch/providers?api_key=${apiKey}`,
  );
  if (!res.ok) return null;

  const data = await res.json();
  const region = data.results?.[REGION];
  if (!region) return null;

  return {
    link: region.link,
    flatrate: region.flatrate,
    rent: region.rent,
    buy: region.buy,
  };
}
