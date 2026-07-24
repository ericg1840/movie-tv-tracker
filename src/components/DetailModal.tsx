import { useEffect, useState, type ReactNode } from 'react';
import type { OmdbDetail, Title } from '../types';
import { getTitleDetail } from '../lib/omdb';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { StatusActions } from './StatusActions';
import { WatchProviders } from './WatchProviders';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === 'N/A') return null;
  return (
    <p className="text-sm text-neutral-700 dark:text-neutral-300">
      <span className="font-medium text-neutral-900 dark:text-neutral-100">{label}:</span>{' '}
      {value}
    </p>
  );
}

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
  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-neutral-900 sm:rounded-2xl"
      >
        <div className="mb-2 flex justify-end">
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-4">
          <div className="h-40 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800">
            {poster ? (
              <img src={poster} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">🎬</div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{badges}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">{children}</div>
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
      <Field label="Genre" value={live.genre} />
      <Field label="Director" value={live.director} />
      <Field label="Starring" value={live.actors} />
      {live.plot && <p className="text-sm text-neutral-700 dark:text-neutral-300">{live.plot}</p>}

      <WatchProviders imdbId={live.imdb_id} />

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
          className="self-start text-xs font-medium text-purple-600 hover:underline disabled:opacity-50 dark:text-purple-400"
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
      <Field label="Genre" value={detail.Genre} />
      <Field label="Director" value={detail.Director} />
      <Field label="Starring" value={detail.Actors} />
      {detail.Plot && detail.Plot !== 'N/A' && (
        <p className="text-sm text-neutral-700 dark:text-neutral-300">{detail.Plot}</p>
      )}

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
        className="mt-2 self-start rounded-full bg-purple-600 px-4 py-1.5 text-xs font-medium text-white disabled:bg-neutral-300 disabled:text-neutral-500 dark:disabled:bg-neutral-700"
      >
        {added ? 'Added ✓' : adding ? 'Adding…' : 'Add to Watchlist'}
      </button>
    </ModalShell>
  );
}

export function DetailModal() {
  const { target } = useDetail();
  if (!target) return null;
  if (target.kind === 'stored') return <StoredDetail title={target.title} />;
  return <SearchDetail imdbId={target.item.imdbID} />;
}
