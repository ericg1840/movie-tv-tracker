import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { StatusActions } from './StatusActions';

export function TitleCard({ title }: { title: Title }) {
  const { remove } = useTitles();
  const { openStored } = useDetail();

  return (
    <div className="flex gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <button
        onClick={() => openStored(title)}
        aria-label={`View details for ${title.title}`}
        className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800"
      >
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
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => openStored(title)}
            className="truncate text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100"
          >
            {title.title}
          </button>
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

        {title.genre && (
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{title.genre}</p>
        )}

        <div className="mt-1">
          <StatusActions title={title} />
        </div>
      </div>
    </div>
  );
}
