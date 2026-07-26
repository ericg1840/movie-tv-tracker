import type { ReactNode } from 'react';

export type IconName = 'search' | 'bookmark' | 'calendar' | 'check' | 'film' | 'dice' | 'chart';

const PATHS: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.75" />
      <path d="M15.6 15.6 20.5 20.5" />
    </>
  ),
  bookmark: <path d="M6.25 3.75h11.5a.75.75 0 0 1 .75.75v15.75l-6.5-3.75-6.5 3.75V4.5a.75.75 0 0 1 .75-.75Z" />,
  calendar: (
    <>
      <rect x="3.25" y="5.25" width="17.5" height="15.5" rx="2.25" />
      <path d="M3.25 9.75h17.5M8 3.25v4M16 3.25v4" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="m8.25 12.25 2.75 2.75 4.75-5.5" />
    </>
  ),
  film: (
    <>
      <rect x="3.25" y="4.25" width="17.5" height="15.5" rx="2.25" />
      <path d="M8.25 4.25v15.5M15.75 4.25v15.5M3.25 12h17.5M3.25 8.25h5M3.25 15.75h5M15.75 8.25h5M15.75 15.75h5" />
    </>
  ),
  dice: (
    <>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="4" />
      <circle cx="8" cy="8" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  chart: (
    <>
      <path d="M4.25 3.25v16.5h16.5" />
      <path d="M8 19.75v-6M12.5 19.75v-9.5M17 19.75v-4" />
    </>
  ),
};

export function Icon({
  name,
  className,
  strokeWidth = 1.75,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
