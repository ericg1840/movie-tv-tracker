import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { TitleCard } from './TitleCard';

export function ListTab({
  heading,
  emptyMessage,
  filter,
  sort,
}: {
  heading: string;
  emptyMessage: string;
  filter: (title: Title) => boolean;
  sort?: (a: Title, b: Title) => number;
}) {
  const { titles, loading, error, refresh } = useTitles();
  const items = titles.filter(filter).sort(sort);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {heading}
        </h1>
        <button
          onClick={() => refresh()}
          aria-label="Refresh"
          className="text-neutral-400 hover:text-purple-600"
        >
          ↻
        </button>
      </div>

      {loading && titles.length === 0 && <p className="text-sm text-neutral-500">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-neutral-500">{emptyMessage}</p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((title) => (
          <TitleCard key={title.id} title={title} />
        ))}
      </div>
    </div>
  );
}
