"use client";

import { useEffect, useMemo, useRef } from "react";

/** Returns a stable function that calls `callback` only after `delay` ms without new calls. */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delay = 300) {
  const callbackRef = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return useMemo(
    () =>
      (...args: Args) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => callbackRef.current(...args), delay);
      },
    [delay],
  );
}
