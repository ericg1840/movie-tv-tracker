import { useEffect, useMemo, useState } from 'react';
import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import {
  getCredits,
  getPersonCredits,
  getSimilarTitles,
  getTrending,
  posterUrl,
  type Person,
  type TrendingItem,
} from '../lib/tmdb';
import {
  pickSeeds,
  pickTopRatedTitles,
  existingKeySet,
  notAlreadyAdded,
} from '../lib/recommendations';
import { decodeEntities } from '../lib/text';
import { Icon } from './Icon';

interface Row {
  seed: Title;
  items: TrendingItem[];
}

interface PersonRow {
  person: Person;
  items: TrendingItem[];
}

const MAX_PEOPLE = 3;

// From each top-rated title, the director plus its top-billed actor are the
// strongest "more like this" signal short of the title itself.
async function collectNotablePeople(topRated: Title[]): Promise<Person[]> {
  const credits = await Promise.all(topRated.map((t) => getCredits(t.imdb_id)));
  const seen = new Set<number>();
  const people: Person[] = [];
  for (const { director, cast } of credits) {
    for (const person of [director, cast[0]]) {
      if (!person || seen.has(person.id)) continue;
      seen.add(person.id);
      people.push(person);
    }
  }
  return people.slice(0, MAX_PEOPLE);
}

export function PosterRow({
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
          aria-label={`View details for ${item.title}`}
          className="group flex w-28 min-w-0 shrink-0 flex-col gap-1.5 text-left"
        >
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-800 shadow-sm ring-1 ring-transparent transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-brand-900/40 group-hover:ring-brand-500/40">
            {item.poster_path ? (
              <img
                src={posterUrl(item.poster_path)}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                <Icon name="film" className="h-6 w-6" />
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
            <p className="w-full min-w-0 truncate text-xs font-medium text-neutral-200">
              {item.title}
            </p>
            <p className="truncate text-[11px] text-neutral-400">
              {item.year ?? '—'} · {item.media_type === 'tv' ? 'TV' : 'Movie'}
            </p>
          </div>
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
  const [personRows, setPersonRows] = useState<PersonRow[] | undefined>(undefined);

  const seeds = useMemo(() => pickSeeds(titles), [titles]);
  const topRated = useMemo(() => pickTopRatedTitles(titles), [titles]);

  const existingKeys = useMemo(() => existingKeySet(titles), [titles]);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;
    const keep = notAlreadyAdded(existingKeys);

    if (seeds.length === 0) {
      setRows(undefined);
      getTrending()
        .then((items) => !cancelled && setTrending(items.filter(keep)))
        .catch(() => !cancelled && setTrending([]));
      return () => {
        cancelled = true;
      };
    }

    setRows(undefined);
    Promise.all(
      seeds.map(async (seed) => ({
        seed,
        items: (await getSimilarTitles(seed.imdb_id)).filter(keep),
      })),
    )
      .then((results) => !cancelled && setRows(results.filter((r) => r.items.length > 0)))
      .catch(() => !cancelled && setRows([]));

    return () => {
      cancelled = true;
    };
  }, [seeds, existingKeys, loading]);

  useEffect(() => {
    if (loading) return;
    if (topRated.length === 0) {
      setPersonRows([]);
      return;
    }

    let cancelled = false;
    const keep = notAlreadyAdded(existingKeys);
    setPersonRows(undefined);

    (async () => {
      const people = await collectNotablePeople(topRated);
      if (cancelled) return;
      const results = await Promise.all(
        people.map(async (person) => ({
          person,
          items: (await getPersonCredits(person.id)).filter(keep),
        })),
      );
      if (!cancelled) setPersonRows(results.filter((r) => r.items.length > 0));
    })().catch(() => !cancelled && setPersonRows([]));

    return () => {
      cancelled = true;
    };
  }, [topRated, existingKeys, loading]);

  function handleSelect(item: TrendingItem) {
    openDiscover(item);
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-100">For You</h1>
        <p className="mt-0.5 text-sm text-neutral-400">
          {seeds.length > 0
            ? 'Recommendations based on your watchlist and what you’ve watched.'
            : 'Trending picks — add something to your watchlist to get recommendations tailored to you.'}
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
              No recommendations found for your watchlist yet.
            </p>
          )}
          {rows &&
            rows.map(({ seed, items }) => (
              <div key={seed.id} className="flex flex-col gap-2.5">
                <h2 className="text-sm font-semibold text-neutral-100">
                  {seed.status === 'watched' ? 'Because you watched' : 'Because you want to watch'}{' '}
                  <span className="text-brand-300">{decodeEntities(seed.title)}</span>
                </h2>
                <PosterRow items={items} onSelect={handleSelect} />
              </div>
            ))}

          {personRows &&
            personRows.map(({ person, items }) => (
              <div key={person.id} className="flex flex-col gap-2.5">
                <h2 className="text-sm font-semibold text-neutral-100">
                  Because you loved <span className="text-brand-300">{person.name}</span>
                </h2>
                <PosterRow items={items} onSelect={handleSelect} />
              </div>
            ))}
        </>
      )}
    </div>
  );
}
