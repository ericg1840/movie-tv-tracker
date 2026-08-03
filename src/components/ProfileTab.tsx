import { useState } from 'react';
import { ListTab } from './ListTab';
import { RecommendationsTab } from './RecommendationsTab';
import { StatsTab } from './StatsTab';

type Section = 'watched' | 'recommendations' | 'stats';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'watched', label: 'Watched' },
  { id: 'recommendations', label: 'For You' },
  { id: 'stats', label: 'Stats' },
];

export function ProfileTab() {
  const [section, setSection] = useState<Section>('watched');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 p-4 pb-0 text-sm">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`rounded-full px-3 py-1.5 font-medium ${
              section === id ? 'bg-brand-700 text-white' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'watched' && (
        <ListTab
          heading="Watched"
          emptyMessage="Nothing marked as watched yet."
          filter={(t) => t.status === 'watched'}
          sortOptions={[
            {
              label: 'Recently watched',
              fn: (a, b) => (b.watched_at ?? '').localeCompare(a.watched_at ?? ''),
            },
            { label: 'My rating', fn: (a, b) => (b.my_rating ?? -1) - (a.my_rating ?? -1) },
            {
              label: 'IMDb rating',
              fn: (a, b) => Number(b.imdb_rating ?? 0) - Number(a.imdb_rating ?? 0),
            },
            { label: 'Title (A–Z)', fn: (a, b) => a.title.localeCompare(b.title) },
          ]}
        />
      )}
      {section === 'recommendations' && <RecommendationsTab />}
      {section === 'stats' && <StatsTab />}
    </div>
  );
}
