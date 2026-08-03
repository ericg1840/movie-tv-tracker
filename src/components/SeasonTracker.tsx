import { useEffect, useState } from 'react';
import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { getSeasonEpisodes, getSeasons, type Episode, type Season } from '../lib/tmdb';
import { Icon } from './Icon';

function EpisodeDot({ watched }: { watched: boolean }) {
  return (
    <Icon
      name="check"
      strokeWidth={watched ? 2 : 1.5}
      className={`h-4 w-4 shrink-0 ${watched ? 'text-brand-400' : 'text-neutral-600'}`}
    />
  );
}

function SeasonRow({ title, season }: { title: Title; season: Season }) {
  const { setWatchedEpisodes } = useTitles();
  const [expanded, setExpanded] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[] | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const key = String(season.season_number);
  const watched = title.watched_episodes[key] ?? [];
  const watchedSet = new Set(watched);
  const total = season.episode_count;
  const allWatched = total > 0 && watchedSet.size >= total;

  async function toggleEpisode(episodeNumber: number) {
    const current = new Set(title.watched_episodes[key] ?? []);
    if (current.has(episodeNumber)) current.delete(episodeNumber);
    else current.add(episodeNumber);
    setSaving(true);
    try {
      await setWatchedEpisodes(title.id, {
        ...title.watched_episodes,
        [key]: Array.from(current).sort((a, b) => a - b),
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleWholeSeason() {
    setSaving(true);
    try {
      await setWatchedEpisodes(title.id, {
        ...title.watched_episodes,
        [key]: allWatched ? [] : Array.from({ length: total }, (_, i) => i + 1),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && episodes === undefined) {
      setEpisodes(await getSeasonEpisodes(title.imdb_id, season.season_number));
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 py-1.5">
        <button
          onClick={toggleWholeSeason}
          disabled={saving || total === 0}
          aria-label={allWatched ? `Mark ${season.name} unwatched` : `Mark ${season.name} watched`}
          className="shrink-0 disabled:opacity-50"
        >
          <EpisodeDot watched={allWatched} />
        </button>
        <button
          onClick={handleExpand}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span className="shrink-0 text-sm font-medium text-neutral-200">{season.name}</span>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${total > 0 ? Math.min(100, (watchedSet.size / total) * 100) : 0}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-neutral-400">
            {watchedSet.size}/{total}
          </span>
          <span
            className={`shrink-0 text-neutral-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-1 py-1 pl-7">
          {episodes === undefined && (
            <p className="text-xs text-neutral-500">Loading episodes…</p>
          )}
          {episodes && episodes.length === 0 && (
            <p className="text-xs text-neutral-500">No episode data available.</p>
          )}
          {episodes?.map((ep) => (
            <button
              key={ep.episode_number}
              onClick={() => toggleEpisode(ep.episode_number)}
              disabled={saving}
              className="flex items-center gap-2 py-1 text-left disabled:opacity-50"
            >
              <EpisodeDot watched={watchedSet.has(ep.episode_number)} />
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-300">
                E{ep.episode_number} · {ep.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SeasonTracker({ title }: { title: Title }) {
  const [seasons, setSeasons] = useState<Season[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setSeasons(undefined);
    getSeasons(title.imdb_id)
      .then((s) => !cancelled && setSeasons(s))
      .catch(() => !cancelled && setSeasons([]));
    return () => {
      cancelled = true;
    };
  }, [title.imdb_id]);

  if (seasons === undefined) {
    return (
      <div className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-neutral-950/40 p-3.5">
        <div className="h-4 w-20 animate-pulse rounded bg-neutral-800" />
        <div className="h-6 w-full animate-pulse rounded bg-neutral-800" />
      </div>
    );
  }

  if (seasons.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-neutral-950/40 p-3.5">
      <h3 className="mb-1 text-sm font-semibold text-neutral-100">Seasons</h3>
      {seasons.map((season) => (
        <SeasonRow key={season.season_number} title={title} season={season} />
      ))}
    </div>
  );
}
