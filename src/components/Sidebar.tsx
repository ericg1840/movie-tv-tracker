import { Icon } from './Icon';
import { TABS, type Tab } from '../lib/tabs';

export function Sidebar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="sticky top-[57px] hidden h-[calc(100dvh-57px)] w-56 shrink-0 flex-col gap-1 border-r border-white/5 p-3 md:flex">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-950/50 text-brand-400'
                : 'text-neutral-400 hover:bg-neutral-900'
            }`}
          >
            <Icon name={tab.icon} strokeWidth={isActive ? 2.25 : 1.75} className="h-5 w-5" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
