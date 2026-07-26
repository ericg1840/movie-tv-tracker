import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { OmdbDetail, Title } from '../types';
import { getTitleDetail } from '../lib/omdb';
import { getImdbId, posterUrl, type TrendingItem } from '../lib/tmdb';
import { useBodyScrollLock } from '../lib/useBodyScrollLock';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { StatusActions } from './StatusActions';
import { WatchProviders } from './WatchProviders';
import { Trailer } from './Trailer';
import { Icon } from './Icon';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === 'N/A') return null;
  return (
    <p className="text-sm text-neutral-700 dark:text-neutral-300">
      <span className="font-medium text-neutral-900 dark:text-neutral-100">{label}:</span>{' '}
      {value}
    </p>
  );
}

const PLOT_PREVIEW_LENGTH = 160;

function ExpandablePlot({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > PLOT_PREVIEW_LENGTH;
  const shown = expanded || !isLong ? text : text.slice(0, PLOT_PREVIEW_LENGTH).trimEnd() + '…';

  return (
    <p className="text-sm text-neutral-700 dark:text-neutral-300">
      {shown}{' '}
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </p>
  );
}

function NotesField({ title }: { title: Title }) {
  const { setNotes } = useTitles();
  const [value, setValue] = useState(title.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    const normalized = value.trim() || null;
    if (normalized === (title.notes ?? null)) return;
    setSaving(true);
    try {
      await setNotes(title.id, normalized);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          Notes
        </label>
        {saving && <span className="text-xs text-neutral-400">Saving…</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Why you want to watch it, where you left off…"
        rows={3}
        className="w-full resize-none rounded-2xl border border-black/5 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm outline-none ring-1 ring-black/[0.02] focus:border-brand-400 dark:border-white/5 dark:bg-neutral-950/40 dark:text-neutral-100 dark:ring-white/[0.02]"
      />
    </div>
  );
}

const MODAL_TRANSITION_MS = 200;

function ModalShell({
  poster,
  title,
  badges,
  onClose,
  children,
}: {
  poster: string | null;
  title: string;
  badges: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useBodyScrollLock();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    window.setTimeout(onClose, MODAL_TRANSITION_MS);
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  return (
    <div
      className={`fixed inset-0 z-20 flex items-end justify-center overscroll-contain bg-black/60 transition-opacity duration-200 sm:items-center ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-t-3xl bg-white transition-all duration-200 ease-out dark:bg-neutral-900 sm:rounded-3xl ${
          visible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-6 opacity-0 sm:translate-y-0 sm:scale-95'
        }`}
      >
        {/*
         * Blurred poster wash. It's absolutely positioned inside the scroll
         * container so it scrolls away with the content, and it runs well past
         * the header so the artwork dissolves into the panel gradually instead
         * of stopping at a hard edge partway down.
         */}
        {poster && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] overflow-hidden"
          >
            <img
              src={poster}
              alt=""
              className="h-full w-full scale-125 object-cover opacity-45 blur-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white dark:via-neutral-900/60 dark:to-neutral-900" />
          </div>
        )}

        <div className="relative h-40 shrink-0">
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-transform hover:scale-110 hover:bg-black/50"
          >
            ✕
          </button>

          <div className="absolute inset-x-4 bottom-3 flex items-end gap-3">
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-200 shadow-lg ring-2 ring-white dark:bg-neutral-800 dark:ring-neutral-900">
              {poster ? (
                <img src={poster} alt={title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  <Icon name="film" className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 pb-1">
              <h2 className="truncate text-xl font-bold leading-tight text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {badges}
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col gap-2.5 p-4">{children}</div>
      </div>
    </div>
  );
}

function StoredDetail({ title }: { title: Title }) {
  const { titles, refreshDetails } = useTitles();
  const { close } = useDetail();
  const [refreshing, setRefreshing] = useState(false);
  const live = titles.find((t) => t.id === title.id);

  useEffect(() => {
    if (!live) close();
  }, [live, close]);

  if (!live) return null;

  const badges = [
    live.media_type === 'series' ? 'TV' : 'Movie',
    live.year,
    live.runtime,
    live.imdb_rating ? `⭐ ${live.imdb_rating}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const missingDetails = !live.director && !live.actors;

  return (
    <ModalShell poster={live.poster_url} title={live.title} badges={badges} onClose={close}>
      <Trailer imdbId={live.imdb_id} />

      <Field label="Genre" value={live.genre} />
      <Field label="Director" value={live.director} />
      <Field label="Starring" value={live.actors} />
      {live.plot && <ExpandablePlot text={live.plot} />}

      <WatchProviders imdbId={live.imdb_id} />

      <NotesField title={live} />

      {missingDetails && (
        <button
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            try {
              await refreshDetails(live.id);
            } finally {
              setRefreshing(false);
            }
          }}
          className="self-start text-xs font-medium text-brand-700 hover:underline disabled:opacity-50 dark:text-brand-400"
        >
          {refreshing ? 'Loading details…' : 'Load director & cast'}
        </button>
      )}

      <div className="mt-2">
        <StatusActions title={live} />
      </div>
    </ModalShell>
  );
}

function SearchDetail({ imdbId }: { imdbId: string }) {
  const { titles, addByImdbId } = useTitles();
  const { close } = useDetail();
  const [detail, setDetail] = useState<OmdbDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTitleDetail(imdbId)
      .then((d) => !cancelled && setDetail(d))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [imdbId]);

  const added = titles.some((t) => t.imdb_id === imdbId);

  if (loading) {
    return (
      <ModalShell poster={null} title="Loading…" badges="" onClose={close}>
        <p className="text-sm text-neutral-500">Loading details…</p>
      </ModalShell>
    );
  }

  if (error || !detail) {
    return (
      <ModalShell poster={null} title="Error" badges="" onClose={close}>
        <p className="text-sm text-red-500">{error ?? 'Could not load details'}</p>
      </ModalShell>
    );
  }

  const badges = [
    detail.Type === 'series' ? 'TV' : 'Movie',
    detail.Year,
    detail.Runtime !== 'N/A' ? detail.Runtime : null,
    detail.imdbRating !== 'N/A' ? `⭐ ${detail.imdbRating}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ModalShell
      poster={detail.Poster !== 'N/A' ? detail.Poster : null}
      title={detail.Title}
      badges={badges}
      onClose={close}
    >
      <Trailer imdbId={imdbId} />

      <Field label="Genre" value={detail.Genre} />
      <Field label="Director" value={detail.Director} />
      <Field label="Starring" value={detail.Actors} />
      {detail.Plot && detail.Plot !== 'N/A' && <ExpandablePlot text={detail.Plot} />}

      <WatchProviders imdbId={imdbId} />

      <button
        disabled={added || adding}
        onClick={async () => {
          setAdding(true);
          try {
            await addByImdbId(imdbId);
          } finally {
            setAdding(false);
          }
        }}
        className="mt-2 self-start rounded-full bg-brand-700 px-4 py-1.5 text-xs font-medium text-white disabled:bg-neutral-300 disabled:text-neutral-500 dark:disabled:bg-neutral-700"
      >
        {added ? 'Added ✓' : adding ? 'Adding…' : 'Add to Watchlist'}
      </button>
    </ModalShell>
  );
}

function DiscoverDetail({ item }: { item: TrendingItem }) {
  const { close } = useDetail();
  const [imdbId, setImdbId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setImdbId(undefined);
    getImdbId(item.id, item.media_type)
      .then((id) => !cancelled && setImdbId(id))
      .catch(() => !cancelled && setImdbId(null));
    return () => {
      cancelled = true;
    };
  }, [item.id, item.media_type]);

  if (imdbId === undefined) {
    return (
      <ModalShell
        poster={item.poster_path ? posterUrl(item.poster_path) : null}
        title={item.title}
        badges={[item.media_type === 'tv' ? 'TV' : 'Movie', item.year].filter(Boolean).join(' · ')}
        onClose={close}
      >
        <p className="text-sm text-neutral-500">Loading details…</p>
      </ModalShell>
    );
  }

  if (!imdbId) {
    return (
      <ModalShell
        poster={item.poster_path ? posterUrl(item.poster_path) : null}
        title={item.title}
        badges=""
        onClose={close}
      >
        <p className="text-sm text-red-500">Could not find details for this title.</p>
      </ModalShell>
    );
  }

  return <SearchDetail imdbId={imdbId} />;
}

export function DetailModal() {
  const { target } = useDetail();
  if (!target) return null;
  if (target.kind === 'stored') return <StoredDetail title={target.title} />;
  if (target.kind === 'discover') return <DiscoverDetail item={target.item} />;
  return <SearchDetail imdbId={target.item.imdbID} />;
}
