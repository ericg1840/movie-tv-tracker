import { useEffect } from 'react';

/**
 * Freezes the page behind a modal while it's open.
 *
 * `overflow: hidden` on the body isn't enough on iOS Safari — it still lets
 * the page scroll underneath. Pinning the body with `position: fixed` and
 * offsetting it by the current scroll position does hold, at the cost of
 * having to restore the scroll position when the modal closes.
 */
export function useBodyScrollLock() {
  useEffect(() => {
    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, []);
}
