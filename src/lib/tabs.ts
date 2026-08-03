import type { IconName } from '../components/Icon';

export type Tab = 'home' | 'search' | 'watchlist' | 'upcoming' | 'watched' | 'recommendations' | 'stats';

export const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'search', label: 'Add', icon: 'search' },
  { id: 'watchlist', label: 'Watchlist', icon: 'bookmark' },
  { id: 'upcoming', label: 'Upcoming', icon: 'calendar' },
  { id: 'watched', label: 'Watched', icon: 'check' },
  { id: 'recommendations', label: 'For You', icon: 'sparkle' },
  { id: 'stats', label: 'Stats', icon: 'chart' },
];
