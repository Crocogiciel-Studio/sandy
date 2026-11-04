import { useCallback, useEffect, useState } from 'react';
import type { ActionResult, SandboxSummary } from '../../../contracts/api';

const messageOf = (reason: unknown): string => (reason instanceof Error ? reason.message : String(reason));

// The sandboxes `sbx ls` reports; re-read on demand, never kept as a source of truth.
export function useSandboxes() {
  const [sandboxes, setSandboxes] = useState<SandboxSummary[]>([]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<string>();

  const refresh = useCallback(async (keepError = false) => {
    if (!keepError) setError(undefined);
    try {
      const result = await window.sandy.session.listSandboxes();
      if (result.ok) setSandboxes(result.sandboxes);
      else setError(result.message);
    } catch (reason) {
      setError(messageOf(reason));
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
      setError(messageOf(reason));
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

  async function whileBusy(sandbox: SandboxSummary, run: () => Promise<void>): Promise<void> {
    setBusy(sandbox.name);
    try {
      await run();
    } finally {
      setBusy(undefined);
    }
  }

  return { sandboxes, error, busy, refresh, stop, remove, whileBusy };
}

export type Sandboxes = ReturnType<typeof useSandboxes>;
