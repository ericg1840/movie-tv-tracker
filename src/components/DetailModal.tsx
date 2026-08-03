import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { OmdbDetail, Title } from '../types';
import { getTitleDetail } from '../lib/omdb';
import { getImdbId, getSimilarTitles, posterUrl, type TrendingItem } from '../lib/tmdb';
import { useBodyScrollLock } from '../lib/useBodyScrollLock';
import { decodeEntities } from '../lib/text';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { StatusActions } from './StatusActions';
import { SeasonTracker } from './SeasonTracker';
import { WatchProviders } from './WatchProviders';
import { Trailer } from './Trailer';
import { Icon } from './Icon';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === 'N/A') return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-neutral-400">{label}</span>
      <span className="text-sm text-neutral-200">
        {decodeEntities(value)}
      </span>
    </div>
  );
}

function GenreTags({ value }: { value: string | null | undefined }) {
  if (!value || value === 'N/A') return null;
  const genres = decodeEntities(value)
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1.5">
      {genres.map((g) => (
        <span
          key={g}
          className="rounded-full bg-brand-950/50 px-2.5 py-1 text-xs font-medium text-brand-300"
        >
          {g}
        </span>
      ))}
    </div>
  );
}

const PLOT_PREVIEW_LENGTH = 160;

function ExpandablePlot({ text: rawText }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const text = decodeEntities(rawText);
  const isLong = text.length > PLOT_PREVIEW_LENGTH;
  const shown = expanded || !isLong ? text : text.slice(0, PLOT_PREVIEW_LENGTH).trimEnd() + '…';

  return (
    <p className="text-sm text-neutral-300">
      {shown}{' '}
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="font-medium text-brand-400 hover:underline"
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
        <label className="text-xs font-semibold text-neutral-400">
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
        className="w-full resize-none rounded-2xl border border-white/5 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 shadow-sm outline-none ring-1 ring-white/[0.02] focus:border-brand-400"
      />
    </div>
  );
}

const SIMILAR_SCROLL_STEP = 240;

function SimilarTitles({ imdbId }: { imdbId: string }) {
  const { openDiscover } = useDetail();
  const [items, setItems] = useState<TrendingItem[] | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(undefined);
    getSimilarTitles(imdbId)
      .then((r) => !cancelled && setItems(r))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [imdbId]);

  // A plain mouse wheel only sends vertical delta, so this row (horizontal
  // overflow only) never receives anything to scroll with by default.
  // React's onWheel is passive, which can't preventDefault, so this needs a
  // real DOM listener to stop the vertical scroll from also moving the modal.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [items]);

  if (!items || items.length === 0) return null;

  function scrollByStep(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * SIMILAR_SCROLL_STEP, behavior: 'smooth' });
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-neutral-100">
        More like this
      </h3>
      <div className="group/scroll relative -mx-4">
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto px-4 pb-1">
          {items.map((item) => (
            <button
              key={`${item.media_type}-${item.id}`}
              onClick={() => openDiscover(item)}
              className="flex w-20 min-w-0 shrink-0 flex-col gap-1 text-left"
            >
              <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-neutral-800 shadow-sm">
                {item.poster_path ? (
                  <img
                    src={posterUrl(item.poster_path)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <Icon name="film" className="h-5 w-5" />
                  </div>
                )}
              </div>
              <p className="w-full min-w-0 truncate text-[11px] font-medium text-neutral-300">
                {item.title}
              </p>
            </button>
          ))}
        </div>
        <button
          onClick={() => scrollByStep(-1)}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover/scroll:opacity-100 md:flex"
        >
          ‹
        </button>
        <button
          onClick={() => scrollByStep(1)}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover/scroll:opacity-100 md:flex"
        >
          ›
        </button>
      </div>
    </div>
  );
}

const MODAL_TRANSITION_MS = 200;

function ModalShell({
  poster,
  title: rawTitle,
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
  const title = decodeEntities(rawTitle);
  useBodyScrollLock();
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // iOS rubber-bands a scrolled element when you drag past its start/end,
  // briefly revealing the panel's flat background above the poster wash.
  // Stopping the drag's default action right at the boundary (rather than
  // trying to guess how far a bounce might reveal) keeps the gesture from
  // triggering the bounce at all.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const deltaY = e.touches[0].clientY - startY;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight;
      if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
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
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-t-3xl bg-neutral-900 transition-all duration-200 ease-out sm:rounded-3xl md:h-[85dvh] md:max-h-[85dvh] md:max-w-4xl md:flex-row md:overflow-hidden lg:max-w-5xl ${
          visible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-6 opacity-0 sm:translate-y-0 sm:scale-95'
        }`}
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-transform hover:scale-110 hover:bg-black/50"
        >
          ✕
        </button>

        {/*
         * Blurred poster wash. It's absolutely positioned inside the scroll
         * container so it scrolls away with the content, and it runs well past
         * the header so the artwork dissolves into the panel gradually instead
         * of stopping at a hard edge partway down. Desktop swaps this compact
         * header for a full poster column instead, so the wash is mobile-only.
         */}
        {poster && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] overflow-hidden md:hidden"
          >
            <img
              src={poster}
              alt=""
              className="h-full w-full scale-125 object-cover opacity-45 blur-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-900/60 to-neutral-900" />
          </div>
        )}

        <div className="relative h-40 shrink-0 md:hidden">
          <div className="absolute inset-x-4 bottom-3 flex items-end gap-3">
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-800 shadow-lg ring-2 ring-neutral-900">
              {poster ? (
                <img src={poster} alt={title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  <Icon name="film" className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 pb-1">
              <h2 className="truncate text-xl font-bold leading-tight text-neutral-100">
                {title}
              </h2>
              <p className="text-xs font-medium text-neutral-400">
                {badges}
              </p>
            </div>
          </div>
        </div>

        {/*
         * Desktop poster column. The column's aspect ratio is much taller/
         * narrower than a poster's natural 2:3, so object-cover here would
         * crop it down to a thin sliver. Instead: a blurred, scaled copy of
         * the poster fills the column (same trick the mobile wash uses),
         * with the full uncropped poster centered on top of it.
         */}
        <div className="relative hidden shrink-0 overflow-hidden bg-neutral-950 md:block md:h-full md:w-72 lg:w-80">
          {poster ? (
            <>
              <img
                src={poster}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl"
              />
              <div className="absolute inset-0 bg-neutral-950/30" />
              <div className="relative flex h-full w-full min-w-0 items-center justify-center p-6">
                <img
                  src={poster}
                  alt={title}
                  className="min-h-0 min-w-0 max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                />
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-400">
              <Icon name="film" className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col md:h-full md:overflow-y-auto">
          <div className="hidden shrink-0 border-b border-white/5 bg-neutral-900/95 px-6 pb-4 pt-6 md:block">
            <h2 className="text-2xl font-bold leading-tight text-neutral-100">{title}</h2>
            <p className="mt-1 text-sm font-medium text-neutral-400">{badges}</p>
          </div>
          <div className="relative flex flex-col gap-2.5 p-4 md:p-6">{children}</div>
        </div>
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

      <GenreTags value={live.genre} />
      <Field label="Director" value={live.director} />
      <Field label="Starring" value={live.actors} />
      {live.plot && <ExpandablePlot text={live.plot} />}

      {live.media_type === 'series' && <SeasonTracker title={live} />}

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
          className="self-start text-xs font-medium text-brand-400 hover:underline disabled:opacity-50"
        >
          {refreshing ? 'Loading details…' : 'Load director & cast'}
        </button>
      )}

      <div className="mt-2">
        <StatusActions title={live} />
      </div>

      <SimilarTitles imdbId={live.imdb_id} />
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

      <GenreTags value={detail.Genre} />
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
        className="mt-2 self-start rounded-full bg-brand-700 px-4 py-1.5 text-xs font-medium text-white disabled:bg-neutral-700 disabled:text-neutral-500"
      >
        {added ? 'Added ✓' : adding ? 'Adding…' : 'Add to Watchlist'}
      </button>

      <SimilarTitles imdbId={imdbId} />
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
