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

export interface TrendingItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year: string | null;
  poster_path: string | null;
}

export function posterUrl(path: string): string {
  return `https://image.tmdb.org/t/p/w342${path}`;
}

interface TmdbTrendingResult {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
}

export async function getTrending(mediaType?: 'movie' | 'tv'): Promise<TrendingItem[]> {
  const path = mediaType ? `trending/${mediaType}/week` : 'trending/all/week';
  const res = await fetch(`${BASE_URL}/${path}?api_key=${apiKey}`);
  if (!res.ok) throw new Error('Failed to load trending titles');
  const data = await res.json();
  const results: TmdbTrendingResult[] = data.results ?? [];

  return results
    .filter((r) => mediaType || r.media_type === 'movie' || r.media_type === 'tv')
    .map((r) => ({
      id: r.id,
      media_type: mediaType ?? (r.media_type as 'movie' | 'tv'),
      title: r.title ?? r.name ?? 'Untitled',
      year: (r.release_date ?? r.first_air_date ?? '').slice(0, 4) || null,
      poster_path: r.poster_path,
    }));
}

export async function getSimilarTitles(imdbId: string): Promise<TrendingItem[]> {
  const target = await findTmdbTarget(imdbId);
  if (!target) return [];

  const res = await fetch(
    `${BASE_URL}/${target.mediaType}/${target.id}/recommendations?api_key=${apiKey}`,
  );
  if (!res.ok) return [];

  const data = await res.json();
  const results: TmdbTrendingResult[] = data.results ?? [];

  return results.slice(0, 12).map((r) => ({
    id: r.id,
    media_type: target.mediaType,
    title: r.title ?? r.name ?? 'Untitled',
    year: (r.release_date ?? r.first_air_date ?? '').slice(0, 4) || null,
    poster_path: r.poster_path,
  }));
}

export async function getImdbId(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/${mediaType}/${tmdbId}/external_ids?api_key=${apiKey}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.imdb_id || null;
}

export interface Trailer {
  key: string;
  name: string;
}

interface TmdbVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export async function getTrailer(imdbId: string): Promise<Trailer | null> {
  const target = await findTmdbTarget(imdbId);
  if (!target) return null;

  const res = await fetch(`${BASE_URL}/${target.mediaType}/${target.id}/videos?api_key=${apiKey}`);
  if (!res.ok) return null;

  const data = await res.json();
  const videos: TmdbVideo[] = (data.results ?? []).filter((v: TmdbVideo) => v.site === 'YouTube');

  const trailer =
    videos.find((v) => v.type === 'Trailer' && v.official) ??
    videos.find((v) => v.type === 'Trailer') ??
    videos.find((v) => v.type === 'Teaser') ??
    videos[0];

  return trailer ? { key: trailer.key, name: trailer.name } : null;
}

export interface Season {
  season_number: number;
  name: string;
  episode_count: number;
}

export interface Episode {
  episode_number: number;
  name: string;
  air_date: string | null;
}

export async function getSeasons(imdbId: string): Promise<Season[]> {
  const target = await findTmdbTarget(imdbId);
  if (!target || target.mediaType !== 'tv') return [];

  const res = await fetch(`${BASE_URL}/tv/${target.id}?api_key=${apiKey}`);
  if (!res.ok) return [];

  const data = await res.json();
  const seasons: Season[] = data.seasons ?? [];
  // Season 0 is "Specials" on TMDB, not a real season of the show.
  return seasons.filter((s) => s.season_number > 0);
}

export async function getSeasonEpisodes(
  imdbId: string,
  seasonNumber: number,
): Promise<Episode[]> {
  const target = await findTmdbTarget(imdbId);
  if (!target || target.mediaType !== 'tv') return [];

  const res = await fetch(
    `${BASE_URL}/tv/${target.id}/season/${seasonNumber}?api_key=${apiKey}`,
  );
  if (!res.ok) return [];

  const data = await res.json();
  const episodes: { episode_number: number; name: string; air_date: string | null }[] =
    data.episodes ?? [];
  return episodes.map((e) => ({
    episode_number: e.episode_number,
    name: e.name,
    air_date: e.air_date || null,
  }));
}
