import { useEffect, useRef, useState } from 'react';
import type { Title } from '../types';
import { useTitles } from '../context/TitlesContext';
import { useDetail } from '../context/DetailContext';
import { decodeEntities } from '../lib/text';
import { todayIso } from '../lib/dates';
import { StatusActions } from './StatusActions';
import { Icon } from './Icon';

const REMOVE_TRANSITION_MS = 180;

// Width of each swipe-revealed action panel, in px. Matches the `w-24` class
// used on the panels below.
const ACTION_WIDTH = 96;
const AXIS_LOCK_THRESHOLD = 8;

export function TitleCard({ title }: { title: Title }) {
  const { remove, setStatus } = useTitles();
  const { openStored } = useDetail();
  const [removing, setRemoving] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragXRef = useRef(0);
  const suppressClickRef = useRef(false);
  const gestureRef = useRef<{ startX: number; startY: number; baseX: number; axis: 'none' | 'x' | 'y' } | null>(
    null,
  );
  const displayTitle = decodeEntities(title.title);

  const isUpcoming = !!title.released_on && title.released_on > todayIso();
  const primaryAction = isUpcoming
    ? null
    : title.status === 'want_to_watch'
      ? { label: '▶ Start watching', run: () => setStatus(title.id, 'watching') }
      : title.status === 'watching'
        ? { label: '✓ Mark watched', run: () => setStatus(title.id, 'watched') }
        : { label: '↺ Rewatch', run: () => setStatus(title.id, 'want_to_watch') };

  function setX(x: number) {
    dragXRef.current = x;
    setDragX(x);
  }

  function handleRemove() {
    setX(0);
    setRemoving(true);
    window.setTimeout(() => remove(title.id), REMOVE_TRANSITION_MS);
  }

  // Tapping the card while a swipe panel is open closes it instead of
  // opening the detail modal; the click right after a real drag is also
  // swallowed so a swipe never accidentally triggers navigation.
  function handleOpen() {
    if (suppressClickRef.current) return;
    if (dragXRef.current !== 0) {
      setX(0);
      return;
    }
    openStored(title);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      gestureRef.current = { startX: t.clientX, startY: t.clientY, baseX: dragXRef.current, axis: 'none' };
    }

    function onTouchMove(e: TouchEvent) {
      const g = gestureRef.current;
      if (!g) return;
      const t = e.touches[0];
      const deltaX = t.clientX - g.startX;
      const deltaY = t.clientY - g.startY;

      if (g.axis === 'none') {
        if (Math.abs(deltaX) < AXIS_LOCK_THRESHOLD && Math.abs(deltaY) < AXIS_LOCK_THRESHOLD) return;
        g.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
        if (g.axis === 'x') {
          suppressClickRef.current = true;
          setDragging(true);
        }
      }
      if (g.axis !== 'x') return;

      e.preventDefault();
      const min = -ACTION_WIDTH;
      const max = primaryAction ? ACTION_WIDTH : 0;
      setX(Math.min(max, Math.max(min, g.baseX + deltaX)));
    }

    function onTouchEnd() {
      const g = gestureRef.current;
      gestureRef.current = null;
      if (!g || g.axis !== 'x') return;
      const x = dragXRef.current;
      setDragging(false);
      if (x <= -ACTION_WIDTH / 2) setX(-ACTION_WIDTH);
      else if (primaryAction && x >= ACTION_WIDTH / 2) setX(ACTION_WIDTH);
      else setX(0);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 50);
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [primaryAction?.label]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 left-0 w-24">
        {primaryAction && (
          <button
            onClick={() => {
              primaryAction.run();
              setX(0);
            }}
            className="flex h-full w-full flex-col items-center justify-center gap-1 bg-brand-700 px-1 text-center text-[11px] font-medium leading-tight text-white"
          >
            {primaryAction.label}
          </button>
        )}
      </div>
      <div className="absolute inset-y-0 right-0 w-24">
        <button
          onClick={handleRemove}
          className="flex h-full w-full flex-col items-center justify-center gap-1 bg-accent-600 px-1 text-center text-[11px] font-medium leading-tight text-white"
        >
          ✕ Remove
        </button>
      </div>

      <div
        ref={containerRef}
        style={{ transform: `translateX(${dragX}px)`, touchAction: 'pan-y' }}
        className={`relative z-10 flex h-full gap-3.5 rounded-2xl border border-white/5 bg-neutral-900 p-3 shadow-sm ring-1 ring-white/[0.02] ${
          dragging ? '' : 'transition-transform duration-150 ease-out'
        } ${removing ? 'scale-95 opacity-0 transition-all duration-150 ease-out' : 'scale-100 opacity-100'}`}
      >
        <button
          onClick={handleOpen}
          aria-label={`View details for ${displayTitle}`}
          className="group aspect-[2/3] h-32 shrink-0 overflow-hidden rounded-xl bg-neutral-800 shadow-sm"
        >
          {title.poster_url ? (
            <img
              src={title.poster_url}
              alt={displayTitle}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-400">
              <Icon name="film" className="h-7 w-7" />
            </div>
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={handleOpen}
              className="min-w-0 truncate text-left text-[15px] font-semibold leading-snug text-neutral-100"
            >
              {displayTitle}
            </button>
            <button
              onClick={handleRemove}
              aria-label="Remove"
              className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-red-500"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
            <span className="rounded-full bg-brand-950/50 px-2 py-0.5 font-medium text-brand-300">
              {title.media_type === 'series' ? 'TV' : 'Movie'}
            </span>
            {title.year && <span>{title.year}</span>}
            {title.runtime && <span>· {title.runtime}</span>}
            {title.imdb_rating && <span>· ⭐ {title.imdb_rating}</span>}
          </div>

          {title.genre && (
            <p className="truncate text-xs text-neutral-400">
              {decodeEntities(title.genre)}
            </p>
          )}

          <div className="mt-auto pt-1">
            <StatusActions title={title} />
          </div>
        </div>
      </div>
    </div>
  );
}
