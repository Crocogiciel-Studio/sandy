import { useCallback, useEffect, useRef, useState } from 'react';
import { pendingHosts } from './pending-hosts';

const POLL_MS = 5000;

// sbx has no event stream: a running session's blocked hosts are read by polling.
// Only the visible session is read: hidden ones stay mounted but nobody sees their banner.
export function useBlockedHosts(sessionId: string, active: boolean) {
  const [blocked, setBlocked] = useState<string[]>([]);
  const [kept, setKept] = useState<ReadonlySet<string>>(new Set());

  const inFlight = useRef(false);
  // Bumped on each decision: a read that started before it is stale and dropped.
  const epoch = useRef(0);

  const refresh = useCallback(async (): Promise<void> => {
    if (document.hidden || inFlight.current) return;
    inFlight.current = true;
    const startedAt = epoch.current;
    // A failed read keeps what is shown: the banner must not flicker on a transient sbx error.
    const result = await window.sandy.session.blockedHosts(sessionId).catch(() => undefined);
    inFlight.current = false;
    if (result?.ok && startedAt === epoch.current) setBlocked(result.hosts);
  }, [sessionId]);

  useEffect(() => {
    if (!active) return;
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [active, refresh]);

  return {
    hosts: active ? pendingHosts(blocked, kept) : [],
    keepBlocked: (host: string): void => setKept((all) => new Set(all).add(host)),
    // The allowed host leaves the banner now; main no longer reports it.
    allowed: (host: string): void => {
      epoch.current += 1;
      setBlocked((all) => all.filter((one) => one !== host));
    },
  };
}
