import { useCallback, useEffect, useState } from 'react';
import { pendingHosts } from './pending-hosts';

const POLL_MS = 5000;

// sbx has no event stream: a running session's blocked hosts are read by polling.
export function useBlockedHosts(sessionId: string, ended: boolean) {
  const [blocked, setBlocked] = useState<string[]>([]);
  const [kept, setKept] = useState<ReadonlySet<string>>(new Set());

  const refresh = useCallback(async (): Promise<void> => {
    if (document.hidden) return;
    // A failed read keeps what is shown: the banner must not flicker on a transient sbx error.
    const result = await window.sandy.session.blockedHosts(sessionId).catch(() => undefined);
    if (result?.ok) setBlocked(result.hosts);
  }, [sessionId]);

  useEffect(() => {
    if (ended) return;
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [ended, refresh]);

  return {
    hosts: ended ? [] : pendingHosts(blocked, kept),
    keepBlocked: (host: string): void => setKept((all) => new Set(all).add(host)),
    // The allowed host leaves the banner now; the next poll confirms it from sbx.
    allowed: (host: string): void => {
      setBlocked((all) => all.filter((one) => one !== host));
      void refresh();
    },
  };
}
