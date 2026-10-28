import { useCallback, useEffect, useRef, useState } from 'react';
import type { SbxStatus } from '../../../contracts/api';

// sbx's status, checked on mount and each time the window regains focus until sbx is usable,
// so installing it in another window unblocks sandy without a restart. Undefined while the first check runs.
export function useSbxStatus(): { status: SbxStatus | undefined; checking: boolean; recheck(): void } {
  const [status, setStatus] = useState<SbxStatus>();
  const [checking, setChecking] = useState(false);
  const latest = useRef(0);

  const recheck = useCallback(() => {
    const call = ++latest.current;
    setChecking(true);
    window.sandy.sbx
      .check()
      .catch((error: unknown): SbxStatus => ({ status: 'error', message: error instanceof Error ? error.message : String(error) }))
      .then((next) => {
        if (call !== latest.current) return;
        setStatus(next);
        setChecking(false);
      });
  }, []);

  useEffect(recheck, [recheck]);

  const usable = status?.status === 'ok';
  useEffect(() => {
    if (usable) return;
    window.addEventListener('focus', recheck);
    return () => window.removeEventListener('focus', recheck);
  }, [usable, recheck]);

  return { status, checking, recheck };
}
