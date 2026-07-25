import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { StatusActions } from './StatusActions';
import { Icon } from './Icon';

export function TitleCard({ title }: { title: Title }) {
  const { remove } = useTitles();
  const { openStored } = useDetail();

  return (
    <div className="flex gap-3.5 rounded-2xl border border-black/5 bg-white p-3 shadow-sm ring-1 ring-black/[0.02] dark:border-white/5 dark:bg-neutral-900 dark:ring-white/[0.02]">
      <button
        onClick={() => openStored(title)}
        aria-label={`View details for ${title.title}`}
        className="aspect-[2/3] h-32 shrink-0 overflow-hidden rounded-xl bg-neutral-200 shadow-sm dark:bg-neutral-800"
      >
        {title.poster_url ? (
          <img
            src={title.poster_url}
            alt={title.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            <Icon name="film" className="h-7 w-7" />
          </div>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => openStored(title)}
            className="truncate text-left text-[15px] font-semibold leading-snug text-neutral-900 dark:text-neutral-100"
          >
            {title.title}
          </button>
          <button
            onClick={() => remove(title.id)}
            aria-label="Remove"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
            {title.media_type === 'series' ? 'TV' : 'Movie'}
          </span>
          {title.year && <span>{title.year}</span>}
          {title.runtime && <span>· {title.runtime}</span>}
          {title.imdb_rating && <span>· ⭐ {title.imdb_rating}</span>}
        </div>

        {title.genre && (
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{title.genre}</p>
        )}

        <div className="mt-auto pt-1">
          <StatusActions title={title} />
        </div>
      </div>
    </div>
  );
}
