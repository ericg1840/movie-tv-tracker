import { useEffect, useState } from 'react';
import { getTrending, posterUrl, type TrendingItem } from '../lib/tmdb';
import { useDetail } from '../context/DetailContext';

export function DiscoverGrid() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openDiscover } = useDetail();

  useEffect(() => {
    getTrending()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trending'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Trending this week
      </h2>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <button
            key={`${item.media_type}-${item.id}`}
            onClick={() => openDiscover(item)}
            className="flex flex-col gap-1 text-left"
          >
            <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-200 shadow-sm dark:bg-neutral-800">
              {item.poster_path ? (
                <img
                  src={posterUrl(item.poster_path)}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🎬</div>
              )}
            </div>
            <p className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
              {item.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
