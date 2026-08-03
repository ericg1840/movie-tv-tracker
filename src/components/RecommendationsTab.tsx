import { useEffect, useMemo, useState } from 'react';
import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { getSimilarTitles, getTrending, posterUrl, type TrendingItem } from '../lib/tmdb';
import { decodeEntities } from '../lib/text';
import { Icon } from './Icon';

const MAX_SEEDS = 5;

interface Row {
  seed: Title;
  items: TrendingItem[];
}

function PosterRow({
  items,
  onSelect,
}: {
  items: TrendingItem[];
  onSelect: (item: TrendingItem) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={`${item.media_type}-${item.id}`}
          onClick={() => onSelect(item)}
          className="flex w-28 min-w-0 shrink-0 flex-col gap-1.5 text-left"
        >
          <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-800 shadow-sm">
            {item.poster_path ? (
              <img
                src={posterUrl(item.poster_path)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                <Icon name="film" className="h-6 w-6" />
              </div>
            )}
          </div>
          <p className="w-full min-w-0 truncate text-xs font-medium text-neutral-200">
            {item.title}
          </p>
        </button>
      ))}
    </div>
  );
}

export function RecommendationsTab() {
  const { titles, loading } = useTitles();
  const { openDiscover } = useDetail();
  const [rows, setRows] = useState<Row[] | undefined>(undefined);
  const [trending, setTrending] = useState<TrendingItem[] | undefined>(undefined);

  const seeds = useMemo(() => {
    const watched = titles.filter((t) => t.status === 'watched');
    const rated = watched
      .filter((t) => t.my_rating != null)
      .sort((a, b) => (b.my_rating ?? 0) - (a.my_rating ?? 0));
    const unrated = watched.filter((t) => t.my_rating == null);
    return [...rated, ...unrated].slice(0, MAX_SEEDS);
  }, [titles]);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    if (seeds.length === 0) {
      setRows(undefined);
      getTrending()
        .then((items) => !cancelled && setTrending(items))
        .catch(() => !cancelled && setTrending([]));
      return () => {
        cancelled = true;
      };
    }

    setRows(undefined);
    Promise.all(
      seeds.map(async (seed) => ({ seed, items: await getSimilarTitles(seed.imdb_id) })),
    )
      .then((results) => !cancelled && setRows(results.filter((r) => r.items.length > 0)))
      .catch(() => !cancelled && setRows([]));

    return () => {
      cancelled = true;
    };
  }, [seeds, loading]);

  function handleSelect(item: TrendingItem) {
    openDiscover(item);
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-100">For You</h1>
        <p className="mt-0.5 text-sm text-neutral-400">
          {seeds.length > 0
            ? 'Recommendations based on what you’ve watched.'
            : 'Trending picks — mark something watched to get recommendations tailored to you.'}
        </p>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading...</p>}

      {!loading && seeds.length === 0 && (
        <>
          {trending === undefined && <p className="text-sm text-neutral-500">Loading...</p>}
          {trending && trending.length === 0 && (
            <p className="text-sm text-neutral-500">Couldn't load trending titles right now.</p>
          )}
          {trending && trending.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-sm font-semibold text-neutral-100">Trending this week</h2>
              <PosterRow items={trending} onSelect={handleSelect} />
            </div>
          )}
        </>
      )}

      {!loading && seeds.length > 0 && (
        <>
          {rows === undefined && <p className="text-sm text-neutral-500">Loading...</p>}
          {rows && rows.length === 0 && (
            <p className="text-sm text-neutral-500">
              No recommendations found for what you've watched yet.
            </p>
          )}
          {rows &&
            rows.map(({ seed, items }) => (
              <div key={seed.id} className="flex flex-col gap-2.5">
                <h2 className="text-sm font-semibold text-neutral-100">
                  Because you watched{' '}
                  <span className="text-brand-300">{decodeEntities(seed.title)}</span>
                </h2>
                <PosterRow items={items} onSelect={handleSelect} />
              </div>
            ))}
        </>
      )}
    </div>
  );
}
