import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TitleCard({ title }: { title: Title }) {
  const { setStatus, setRating, remove } = useTitles();
  const releaseLabel = formatDate(title.released_on);
  const isUpcoming = title.released_on ? new Date(title.released_on) > new Date() : false;

  return (
    <div className="flex gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800">
        {title.poster_url ? (
          <img
            src={title.poster_url}
            alt={title.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🎬</div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {title.title}
          </h3>
          <button
            onClick={() => remove(title.id)}
            aria-label="Remove"
            className="shrink-0 text-neutral-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
            {title.media_type === 'series' ? 'TV' : 'Movie'}
          </span>
          {title.year && <span>{title.year}</span>}
          {title.runtime && <span>· {title.runtime}</span>}
          {title.imdb_rating && <span>· ⭐ {title.imdb_rating}</span>}
        </div>

        {isUpcoming && releaseLabel && (
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
            Releases {releaseLabel}
          </p>
        )}

        {title.genre && (
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{title.genre}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {title.status === 'want_to_watch' && (
            <>
              <button
                onClick={() => setStatus(title.id, 'watching')}
                className="rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700"
              >
                ▶ Start watching
              </button>
              <button
                onClick={() => setStatus(title.id, 'watched')}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                ✓ Mark watched
              </button>
            </>
          )}

          {title.status === 'watching' && (
            <>
              <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                Watching
              </span>
              <button
                onClick={() => setStatus(title.id, 'watched')}
                className="rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700"
              >
                ✓ Mark watched
              </button>
            </>
          )}

          {title.status === 'watched' && (
            <>
              <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300">
                My rating
                <select
                  value={title.my_rating ?? ''}
                  onChange={(e) =>
                    setRating(title.id, e.target.value ? Number(e.target.value) : null)
                  }
                  className="rounded border border-black/10 bg-transparent px-1 py-0.5 dark:border-white/10"
                >
                  <option value="">–</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => setStatus(title.id, 'want_to_watch')}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                ↺ Rewatch
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
