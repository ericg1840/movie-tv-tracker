import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { daysUntil, formatDate, todayIso } from '../lib/dates';

function RatingPicker({ title }: { title: Title }) {
  const { setRating } = useTitles();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = title.my_rating === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => setRating(title.id, active ? null : n)}
            aria-pressed={active}
            aria-label={`Rate ${n} out of 10`}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-colors ${
              active
                ? 'bg-brand-700 text-white'
                : 'border border-white/10 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

export function StatusActions({ title }: { title: Title }) {
  const { setStatus } = useTitles();

  if (title.released_on && title.released_on > todayIso()) {
    const days = daysUntil(title.released_on);
    return (
      <div className="flex items-center gap-2 rounded-lg bg-accent-950/50 px-3 py-2">
        <span className="text-lg font-bold leading-none text-accent-400">
          {days}
        </span>
        <span className="text-xs leading-tight text-accent-400">
          {days === 1 ? 'day' : 'days'} until release
          <br />
          {formatDate(title.released_on)}
        </span>
      </div>
    );
  }

  if (title.status === 'want_to_watch') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatus(title.id, 'watching')}
          className="rounded-full bg-brand-700 px-3 py-1 text-xs font-medium text-white hover:bg-brand-800"
        >
          ▶ Start watching
        </button>
        <button
          onClick={() => setStatus(title.id, 'watched')}
          className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
        >
          ✓ Mark watched
        </button>
      </div>
    );
  }

  if (title.status === 'watching') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-900/40 px-2 py-1 text-xs font-medium text-brand-300">
          Watching
        </span>
        <button
          onClick={() => setStatus(title.id, 'watched')}
          className="rounded-full bg-brand-700 px-3 py-1 text-xs font-medium text-white hover:bg-brand-800"
        >
          ✓ Mark watched
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">My rating</span>
        <RatingPicker title={title} />
      </div>
      <button
        onClick={() => setStatus(title.id, 'want_to_watch')}
        className="self-start rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
      >
        ↺ Rewatch
      </button>
    </div>
  );
}
