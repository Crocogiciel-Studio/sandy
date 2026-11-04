import { useState } from 'react';
import { displayHost } from './pending-hosts';
import { useBlockedHosts } from './use-blocked-hosts';

// Non-modal: the agent keeps running while the user decides. Allowing is always for this sandbox only.
export function BlockedHosts({ sessionId, ended }: { sessionId: string; ended: boolean }) {
  const { hosts, keepBlocked, allowed } = useBlockedHosts(sessionId, ended);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState<string>();
  if (hosts.length === 0) return null;

  async function allow(host: string): Promise<void> {
    setError(undefined);
    setPending(host);
    const result = await window.sandy.session.allowHost(sessionId, host).catch((cause: unknown) => ({
      ok: false as const,
      message: cause instanceof Error ? cause.message : String(cause),
    }));
    setPending(undefined);
    if (result.ok) allowed(host);
    else setError(result.message);
  }

  return (
    <div className="blocked-hosts" role="region" aria-label="Blocked domains">
      {hosts.map((host) => (
        <div key={host} className="blocked-host">
          <p>
            <strong>{displayHost(host)}</strong> is blocked for this sandbox. The agent tried to connect to it.
          </p>
          <div className="blocked-actions">
            <button type="button" className="keep" onClick={() => keepBlocked(host)}>
              Keep blocked
            </button>
            <button type="button" className="allow" disabled={pending === host} onClick={() => void allow(host)}>
              Allow {displayHost(host)} permanently
            </button>
          </div>
          <p className="quiet">The agent will be able to send and receive data to this domain, with no time limit.</p>
        </div>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
