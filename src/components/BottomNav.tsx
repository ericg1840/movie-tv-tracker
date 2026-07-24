import { TABS, type Tab } from '../lib/tabs';

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95 md:hidden">
      <div className="mx-auto flex max-w-lg justify-around gap-1 px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)]">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <span className={`leading-none transition-transform ${isActive ? 'scale-110 text-xl' : 'text-lg'}`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
