import { useState } from 'react';
import { TitlesProvider } from './context/TitlesContext';
import { DetailProvider } from './context/DetailContext';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { SearchTab } from './components/SearchTab';
import { ListTab } from './components/ListTab';
import { DetailModal } from './components/DetailModal';
import { todayIso as today } from './lib/dates';
import type { Tab } from './lib/tabs';

function TabContent({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'search':
      return <SearchTab />;
    case 'watchlist':
      return (
        <ListTab
          heading="Watchlist"
          emptyMessage="Nothing here yet. Add something from Search."
          filter={(t) =>
            (t.status === 'want_to_watch' || t.status === 'watching') &&
            (!t.released_on || t.released_on <= today())
          }
          sortOptions={[
            {
              label: 'Watching first',
              fn: (a, b) => {
                if (a.status !== b.status) return a.status === 'watching' ? -1 : 1;
                return b.added_at.localeCompare(a.added_at);
              },
            },
            { label: 'Recently added', fn: (a, b) => b.added_at.localeCompare(a.added_at) },
            { label: 'Title (A–Z)', fn: (a, b) => a.title.localeCompare(b.title) },
            {
              label: 'IMDb rating',
              fn: (a, b) => Number(b.imdb_rating ?? 0) - Number(a.imdb_rating ?? 0),
            },
          ]}
        />
      );
    case 'upcoming':
      return (
        <ListTab
          heading="Upcoming releases"
          emptyMessage="No upcoming releases tracked. Search for a title that hasn't come out yet."
          filter={(t) => !!t.released_on && t.released_on > today() && t.status !== 'watched'}
          sortOptions={[
            {
              label: 'Soonest release',
              fn: (a, b) => (a.released_on ?? '').localeCompare(b.released_on ?? ''),
            },
            { label: 'Title (A–Z)', fn: (a, b) => a.title.localeCompare(b.title) },
          ]}
        />
      );
    case 'watched':
      return (
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
      );
  }
}

function App() {
  const [tab, setTab] = useState<Tab>('watchlist');

  return (
    <TitlesProvider>
      <DetailProvider>
        <div className="flex min-h-dvh flex-col bg-neutral-50 dark:bg-neutral-950">
          <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 px-4 py-3.5 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95">
            <h1 className="mx-auto flex max-w-6xl items-center text-lg font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              <a href="./landing.html" className="flex items-center gap-1.5">
                <img src="./favicon.svg" alt="" className="h-6 w-6 rounded-md" />
                <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-brand-200">
                  Watchlist
                </span>
              </a>
            </h1>
          </header>

          <div className="mx-auto flex w-full max-w-6xl flex-1">
            <Sidebar active={tab} onChange={setTab} />

            <main className="min-w-0 flex-1 pb-2">
              <div className="mx-auto max-w-lg md:max-w-none">
                <TabContent tab={tab} />
              </div>
            </main>
          </div>

          <BottomNav active={tab} onChange={setTab} />
        </div>

        <DetailModal />
      </DetailProvider>
    </TitlesProvider>
  );
}

export default App;
