import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';

export function StatusActions({ title }: { title: Title }) {
  const { setStatus, setRating } = useTitles();

  if (title.status === 'want_to_watch') {
    return (
      <div className="flex flex-wrap items-center gap-2">
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
      </div>
    );
  }

  if (title.status === 'watching') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          Watching
        </span>
        <button
          onClick={() => setStatus(title.id, 'watched')}
          className="rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700"
        >
          ✓ Mark watched
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300">
        My rating
        <select
          value={title.my_rating ?? ''}
          onChange={(e) => setRating(title.id, e.target.value ? Number(e.target.value) : null)}
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
    </div>
  );
}
