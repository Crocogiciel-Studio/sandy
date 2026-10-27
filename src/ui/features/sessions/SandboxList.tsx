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
    <section style={{ padding: '0 16px 16px' }}>
      <h2 style={{ fontSize: 14, margin: '8px 0' }}>
        Sandboxes existantes{' '}
        <button type="button" onClick={() => void refresh()}>
          Actualiser
        </button>
      </h2>
      {error && (
        <p role="alert" style={{ color: '#c62828', margin: 0 }}>
          {error}
        </p>
      )}
      {sandboxes?.length === 0 && <p style={{ margin: 0 }}>Aucune sandbox.</p>}
      {sandboxes && sandboxes.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Nom</th>
              <th align="left">Agent</th>
              <th align="left">Projet</th>
              <th align="left">État</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sandboxes.map((sandbox) => (
              <tr key={sandbox.name}>
                <td>{sandbox.name}</td>
                <td>{sandbox.agent}</td>
                <td title={sandbox.workspaces.join('\n')}>{sandbox.workspaces[0] ?? '—'}</td>
                <td>{sandbox.status}</td>
                <td>
                  <button type="button" disabled={busy !== undefined || sandbox.workspaces.length === 0} onClick={() => void attach(sandbox)}>
                    Ouvrir
                  </button>{' '}
                  <button type="button" disabled={busy !== undefined || sandbox.status !== 'running'} onClick={() => void stop(sandbox)}>
                    Arrêter
                  </button>{' '}
                  <button type="button" disabled={busy !== undefined} onClick={() => void remove(sandbox)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
