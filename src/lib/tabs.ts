import type { IconName } from '../components/Icon';

export type Tab = 'search' | 'watchlist' | 'upcoming' | 'watched' | 'stats';

export const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'search', label: 'Add', icon: 'search' },
  { id: 'watchlist', label: 'Watchlist', icon: 'bookmark' },
  { id: 'upcoming', label: 'Upcoming', icon: 'calendar' },
  { id: 'watched', label: 'Watched', icon: 'check' },
  { id: 'stats', label: 'Stats', icon: 'chart' },
];
