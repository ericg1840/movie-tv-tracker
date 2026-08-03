import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { decodeEntities } from '../lib/text';
import { todayIso } from '../lib/dates';
import { computeStats, computeMonthStats } from '../lib/stats';
import { pickSeeds, existingKeySet, notAlreadyAdded } from '../lib/recommendations';
import { getSimilarTitles, getTrending, type TrendingItem } from '../lib/tmdb';
import { PosterRow } from './RecommendationsTab';
import type { Title } from '../types';
import type { Tab } from '../lib/tabs';
import { Icon } from './Icon';

const SECTION_LIMIT = 10;

function TitlePosterRow({ titles, onSelect }: { titles: Title[]; onSelect: (title: Title) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {titles.map((title) => (
        <button
          key={title.id}
          onClick={() => onSelect(title)}
          aria-label={`View details for ${decodeEntities(title.title)}`}
          className="group flex w-28 min-w-0 shrink-0 flex-col gap-1.5 text-left"
        >
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-800 shadow-sm ring-1 ring-transparent transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-brand-900/40 group-hover:ring-brand-500/40">
            {title.poster_url ? (
              <img
                src={title.poster_url}
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
              {decodeEntities(title.title)}
            </p>
            <p className="truncate text-[11px] text-neutral-400">
              {title.year ?? '—'} · {title.media_type === 'series' ? 'TV' : 'Movie'}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function Section({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100">{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-xs font-medium text-brand-400 hover:text-brand-300">
            See all
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-white/5 bg-neutral-900 p-3.5 shadow-sm ring-1 ring-white/[0.02]">
      <span className="text-2xl font-bold leading-none text-neutral-100">{value}</span>
      <span className="text-xs font-medium text-neutral-400">{label}</span>
    </div>
  );
}

export function HomeTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { titles, loading } = useTitles();
  const { openStored, openDiscover } = useDetail();
  const [recommended, setRecommended] = useState<TrendingItem[] | undefined>(undefined);

  const continueWatching = useMemo(() => titles.filter((t) => t.status === 'watching'), [titles]);

  const comingSoon = useMemo(
    () =>
      titles
        .filter((t) => !!t.released_on && t.released_on > todayIso() && t.status !== 'watched')
        .sort((a, b) => (a.released_on ?? '').localeCompare(b.released_on ?? ''))
        .slice(0, SECTION_LIMIT),
    [titles],
  );

  const recentlyAdded = useMemo(
    () => [...titles].sort((a, b) => b.added_at.localeCompare(a.added_at)).slice(0, SECTION_LIMIT),
    [titles],
  );

  const seeds = useMemo(() => pickSeeds(titles), [titles]);
  const existingKeys = useMemo(() => existingKeySet(titles), [titles]);
  const monthStats = useMemo(() => computeMonthStats(titles), [titles]);
  const stats = useMemo(() => computeStats(titles), [titles]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const keep = notAlreadyAdded(existingKeys);
    const seed = seeds[0];
    const fetcher = seed ? getSimilarTitles(seed.imdb_id) : getTrending();
    fetcher
      .then((items) => !cancelled && setRecommended(items.filter(keep).slice(0, SECTION_LIMIT)))
      .catch(() => !cancelled && setRecommended([]));
    return () => {
      cancelled = true;
    };
  }, [seeds, existingKeys, loading]);

  if (loading && titles.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <h1 className="text-lg font-semibold text-neutral-100">Home</h1>
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (titles.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <h1 className="text-lg font-semibold text-neutral-100">Home</h1>
        <p className="text-sm text-neutral-500">
          Nothing here yet.{' '}
          <button onClick={() => onNavigate('search')} className="font-medium text-brand-400 hover:text-brand-300">
            Search for something to add
          </button>{' '}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <h1 className="text-lg font-semibold text-neutral-100">Home</h1>

      {continueWatching.length > 0 && (
        <Section title="Continue Watching" onSeeAll={() => onNavigate('watchlist')}>
          <TitlePosterRow titles={continueWatching} onSelect={openStored} />
        </Section>
      )}

      {comingSoon.length > 0 && (
        <Section title="Coming Soon" onSeeAll={() => onNavigate('upcoming')}>
          <TitlePosterRow titles={comingSoon} onSelect={openStored} />
        </Section>
      )}

      {recentlyAdded.length > 0 && (
        <Section title="Recently Added">
          <TitlePosterRow titles={recentlyAdded} onSelect={openStored} />
        </Section>
      )}

      <Section title="Recommended for You" onSeeAll={() => onNavigate('recommendations')}>
        {recommended === undefined && <p className="text-sm text-neutral-500">Loading...</p>}
        {recommended && recommended.length === 0 && (
          <p className="text-sm text-neutral-500">No recommendations yet.</p>
        )}
        {recommended && recommended.length > 0 && (
          <PosterRow items={recommended} onSelect={openDiscover} />
        )}
      </Section>

      <Section title="This Month's Stats" onSeeAll={() => onNavigate('stats')}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Watched this month" value={monthStats.watchedCount} />
          <StatTile
            label="Avg rating this month"
            value={monthStats.avgRating != null ? monthStats.avgRating.toFixed(1) : '—'}
          />
          <StatTile label="Currently watching" value={stats.watchingCount} />
          <StatTile label="Backlog" value={stats.backlogCount} />
        </div>
      </Section>
    </div>
  );
}
