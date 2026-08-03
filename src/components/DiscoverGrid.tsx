import { useEffect, useState } from 'react';
import { getTrending, posterUrl, type TrendingItem } from '../lib/tmdb';
import { useDetail } from '../context/DetailContext';
import { Icon } from './Icon';

export function DiscoverGrid({ type }: { type?: 'movie' | 'series' }) {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openDiscover } = useDetail();

  const mediaType = type === 'series' ? 'tv' : type === 'movie' ? 'movie' : undefined;

  useEffect(() => {
    setLoading(true);
    getTrending(mediaType)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trending'))
      .finally(() => setLoading(false));
  }, [mediaType]);

  const heading =
    mediaType === 'movie'
      ? 'Trending movies this week'
      : mediaType === 'tv'
        ? 'Trending TV this week'
        : 'Trending this week';

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-100">{heading}</h2>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {items.map((item) => (
          <button
            key={`${item.media_type}-${item.id}`}
            onClick={() => openDiscover(item)}
            aria-label={`View details for ${item.title}`}
            className="group flex min-w-0 flex-col gap-1 text-left"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-800 shadow-sm ring-1 ring-transparent transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-brand-900/40 group-hover:ring-brand-500/40">
              {item.poster_path ? (
                <img
                  src={posterUrl(item.poster_path)}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  <Icon name="film" className="h-7 w-7" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="mb-1.5 flex items-center gap-1 rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
                  <Icon name="eye" className="h-2.5 w-2.5" />
                  View details
                </span>
              </div>
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="w-full min-w-0 truncate text-xs font-medium text-neutral-100">
                {item.title}
              </p>
              <p className="text-[11px] leading-tight text-neutral-400">
                {item.year ?? '—'} · {item.media_type === 'tv' ? 'TV' : 'Movie'}
                {item.rating != null && <> · ⭐ {item.rating}</>}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
