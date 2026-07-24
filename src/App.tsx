import { useState } from 'react';
import { TitlesProvider } from './context/TitlesContext';
import { BottomNav, type Tab } from './components/BottomNav';
import { SearchTab } from './components/SearchTab';
import { ListTab } from './components/ListTab';

const today = () => new Date().toISOString().slice(0, 10);

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
          sort={(a, b) => {
            if (a.status !== b.status) return a.status === 'watching' ? -1 : 1;
            return b.added_at.localeCompare(a.added_at);
          }}
        />
      );
    case 'upcoming':
      return (
        <ListTab
          heading="Upcoming releases"
          emptyMessage="No upcoming releases tracked. Search for a title that hasn't come out yet."
          filter={(t) => !!t.released_on && t.released_on > today() && t.status !== 'watched'}
          sort={(a, b) => (a.released_on ?? '').localeCompare(b.released_on ?? '')}
        />
      );
    case 'watched':
      return (
        <ListTab
          heading="Watched"
          emptyMessage="Nothing marked as watched yet."
          filter={(t) => t.status === 'watched'}
          sort={(a, b) => (b.watched_at ?? '').localeCompare(a.watched_at ?? '')}
        />
      );
  }
}

function App() {
  const [tab, setTab] = useState<Tab>('watchlist');

  return (
    <TitlesProvider>
      <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-neutral-50 dark:bg-neutral-950">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95">
          <h1 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            🎬 Watchlist
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto pb-2">
          <TabContent tab={tab} />
        </main>

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </TitlesProvider>
  );
}

export default App;
