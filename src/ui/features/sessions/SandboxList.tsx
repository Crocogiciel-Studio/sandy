import { useCallback, useEffect, useState } from 'react';
import type { ActionResult, SandboxSummary } from '../../../contracts/api';

export function SandboxList({ onAttach }: { onAttach: (sandbox: SandboxSummary) => Promise<void> }) {
  const [sandboxes, setSandboxes] = useState<SandboxSummary[]>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<string>();

  const refresh = useCallback(async (keepError = false) => {
    if (!keepError) setError(undefined);
    try {
      const result = await window.sandy.session.listSandboxes();
      if (result.ok) setSandboxes(result.sandboxes);
      else setError(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function act(sandbox: SandboxSummary, run: (name: string) => Promise<ActionResult>): Promise<void> {
    setError(undefined);
    setBusy(sandbox.name);
    try {
      const result = await run(sandbox.name);
      if (!result.ok) setError(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(undefined);
      void refresh(true);
    }
  }

  const stop = (sandbox: SandboxSummary): Promise<void> => act(sandbox, window.sandy.session.stopSandbox);

  function remove(sandbox: SandboxSummary): Promise<void> {
    if (!window.confirm(`Supprimer définitivement la sandbox ${sandbox.name} ? Ses sessions ouvertes seront fermées.`)) return Promise.resolve();
    return act(sandbox, window.sandy.session.removeSandbox);
  }

  async function attach(sandbox: SandboxSummary): Promise<void> {
    setBusy(sandbox.name);
    try {
      await onAttach(sandbox);
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <section className="group sandboxes">
      <h2>
        Sandboxes
        <button type="button" className="quiet" onClick={() => void refresh()}>
          Actualiser
        </button>
      </h2>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {sandboxes?.length === 0 && <p className="empty">Aucune sandbox. Lance une session pour en créer une.</p>}
      {sandboxes && sandboxes.length > 0 && (
        <ul>
          {sandboxes.map((sandbox) => (
            <li key={sandbox.name} className="row">
              <button
                type="button"
                className="row-main"
                title={sandbox.workspaces.join('\n') || sandbox.name}
                disabled={busy !== undefined || sandbox.workspaces.length === 0}
                onClick={() => void attach(sandbox)}
              >
                <span className="dot" data-state={sandbox.status === 'running' ? 'idle' : 'ended'} aria-hidden="true" />
                <span className="row-label">{sandbox.name}</span>
                <span className="row-state">{sandbox.agent}</span>
              </button>
              <span className="actions">
                <button type="button" disabled={busy !== undefined || sandbox.status !== 'running'} onClick={() => void stop(sandbox)}>
                  Arrêter
                </button>
                <button type="button" disabled={busy !== undefined} onClick={() => void remove(sandbox)}>
                  Supprimer
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
