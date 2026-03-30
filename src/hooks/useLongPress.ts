import { useCallback, useRef, type MouseEvent } from 'react';

const DEFAULT_MS = 480;

/**
 * Touch fallback when desktop uses context menu (e.g. exclusive select, discard).
 * Fires `onLongPress` after `ms`; suppresses the following click so tap ≠ click.
 */
export function useLongPress(onLongPress: () => void, ms = DEFAULT_MS) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchStart = useCallback(() => {
    clearTimer();
    suppressClickRef.current = false;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      suppressClickRef.current = true;
      onLongPress();
    }, ms);
  }, [clearTimer, onLongPress, ms]);

  const onTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onTouchCancel = onTouchEnd;

  const wrapClick = useCallback(
    (handler: (e: MouseEvent) => void) => (e: MouseEvent) => {
      if (suppressClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
        suppressClickRef.current = false;
        return;
      }
      handler(e);
    },
    []
  );

  return { onTouchStart, onTouchEnd, onTouchCancel, wrapClick };
}
