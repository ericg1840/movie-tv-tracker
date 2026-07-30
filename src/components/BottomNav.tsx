import { Icon } from './Icon';
import { TABS, type Tab } from '../lib/tabs';

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-white/5 bg-neutral-950/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg justify-around gap-1 px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)]">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'bg-brand-950/50 text-brand-400'
                  : 'text-neutral-400'
              }`}
            >
              <Icon name={tab.icon} strokeWidth={isActive ? 2.25 : 1.75} className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
