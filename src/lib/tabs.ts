export type Tab = 'search' | 'watchlist' | 'upcoming' | 'watched';

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'search', label: 'Add', icon: '🔍' },
  { id: 'watchlist', label: 'Watchlist', icon: '📺' },
  { id: 'upcoming', label: 'Upcoming', icon: '📅' },
  { id: 'watched', label: 'Watched', icon: '✅' },
];
