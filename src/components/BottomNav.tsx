export type Tab = 'search' | 'watchlist' | 'upcoming' | 'watched';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'search', label: 'Add', icon: '🔍' },
  { id: 'watchlist', label: 'Watchlist', icon: '📺' },
  { id: 'upcoming', label: 'Upcoming', icon: '📅' },
  { id: 'watched', label: 'Watched', icon: '✅' },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-1 pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium transition-colors ${
              active === tab.id
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
