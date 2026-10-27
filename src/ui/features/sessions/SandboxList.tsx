import { useCallback, useEffect, useState } from 'react';
import type { SandboxSummary } from '../../../contracts/api';

export function SandboxList({ onAttach }: { onAttach: (sandbox: SandboxSummary) => Promise<void> }) {
  const [sandboxes, setSandboxes] = useState<SandboxSummary[]>();
  const [error, setError] = useState<string>();
  const [attaching, setAttaching] = useState<string>();

  const refresh = useCallback(async () => {
    setError(undefined);
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

  async function attach(sandbox: SandboxSummary): Promise<void> {
    setAttaching(sandbox.name);
    try {
      await onAttach(sandbox);
    } finally {
      setAttaching(undefined);
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
                  <button type="button" disabled={attaching !== undefined || sandbox.workspaces.length === 0} onClick={() => void attach(sandbox)}>
                    Ouvrir
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
