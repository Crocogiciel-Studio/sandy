import { useCallback, useEffect, useRef, useState } from 'react';

// Runs `check` when enabled, then again each time the window regains focus until `done` accepts the result,
// so fixing the problem in another window unblocks sandy without a restart. Undefined while the first check runs.
// `check` must not reject (turn failures into a value) and must keep the same identity between renders.
export function useRecheck<T>(
  check: () => Promise<T>,
  done: (value: T) => boolean,
  enabled = true,
): { value: T | undefined; checking: boolean; recheck(): void } {
  const [value, setValue] = useState<T>();
  const [checking, setChecking] = useState(false);
  const latest = useRef(0);

  const recheck = useCallback(() => {
    const call = ++latest.current;
    setChecking(true);
    void check().then((next) => {
      // A slower, older answer never overwrites a newer one.
      if (call !== latest.current) return;
      setValue(next);
      setChecking(false);
    });
  }, [check]);

  useEffect(() => {
    if (enabled) recheck();
  }, [enabled, recheck]);

  const finished = value !== undefined && done(value);
  useEffect(() => {
    if (!enabled || finished) return;
    window.addEventListener('focus', recheck);
    return () => window.removeEventListener('focus', recheck);
  }, [enabled, finished, recheck]);

  return { value, checking, recheck };
}
