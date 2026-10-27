import './app.css';
import { useState } from 'react';
import type { SandboxSummary, StartSessionResult } from '../../contracts/api';
import { LaunchSession, type LaunchRequest } from '../features/sessions/LaunchSession';
import { SandboxList } from '../features/sessions/SandboxList';
import { openTerminal, Terminal, type TerminalSession } from '../features/terminal/Terminal';

interface Running {
  label: string;
  projectPath: string;
  session: TerminalSession;
  exitCode?: number;
}

const NEW = 'new';

export function App() {
  const [running, setRunning] = useState<Running[]>([]);
  const [active, setActive] = useState<string>(NEW);
  const [error, setError] = useState<string>();

  async function open(
    agent: string,
    projectPath: string,
    start: (cols: number, rows: number) => Promise<StartSessionResult>,
  ): Promise<void> {
    setError(undefined);
    const result = await openTerminal(start, (id, exitCode) =>
      setRunning((all) => all.map((one) => (one.session.id === id ? { ...one, exitCode } : one))),
    );
    if (!result.ok) return setError(result.message);
    const folder = projectPath.split(/[\\/]/).filter(Boolean).pop() ?? projectPath;
    // Two sessions of the same agent on the same project must stay tellable apart.
    setRunning((all) => {
      const base = `${agent} · ${folder}`;
      const same = all.filter((one) => one.label === base || one.label.startsWith(`${base} (`)).length;
      return [...all, { label: same ? `${base} (${same + 1})` : base, projectPath, session: result.session }];
    });
    setActive(result.session.id);
  }

  const launch = ({ agent, projectPath }: LaunchRequest): Promise<void> =>
    open(agent, projectPath, (cols, rows) => window.sandy.session.start({ agent, projectPath, cols, rows }));

  const attach = ({ name, agent, workspaces }: SandboxSummary): Promise<void> =>
    open(agent, workspaces[0] ?? name, (cols, rows) => window.sandy.session.attach({ name, cols, rows }));

  function close(one: Running): void {
    window.sandy.terminal.close(one.session.id);
    one.session.dispose();
    const remaining = running.filter((other) => other !== one);
    setRunning(remaining);
    if (active === one.session.id) setActive(remaining.at(-1)?.session.id ?? NEW);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'var(--font-ui)' }}>
      <h1 style={{ fontSize: 16, margin: 0, padding: '8px 16px', borderBottom: '1px solid var(--line)' }}>sandy</h1>
      <div role="tablist" style={{ display: 'flex', gap: 4, padding: '4px 16px', borderBottom: '1px solid var(--line)' }}>
        {running.map((one) => (
          <span key={one.session.id} style={{ display: 'inline-flex', gap: 2 }}>
            <button
              role="tab"
              aria-selected={active === one.session.id}
              title={one.projectPath}
              style={{ fontWeight: active === one.session.id ? 700 : 400 }}
              onClick={() => setActive(one.session.id)}
            >
              {one.label}
              {one.exitCode !== undefined && ` (terminée, code ${one.exitCode})`}
            </button>
            <button aria-label={`Fermer ${one.label}`} onClick={() => close(one)}>
              ×
            </button>
          </span>
        ))}
        <button
          role="tab"
          aria-selected={active === NEW}
          style={{ fontWeight: active === NEW ? 700 : 400 }}
          onClick={() => {
            setError(undefined);
            setActive(NEW);
          }}
        >
          + Nouvelle session
        </button>
      </div>
      {running.map((one) => (
        <Terminal key={one.session.id} session={one.session} visible={active === one.session.id} />
      ))}
      {active === NEW && (
        <div style={{ overflow: 'auto' }}>
          <LaunchSession onLaunch={launch} error={error} />
          <SandboxList onAttach={attach} />
        </div>
      )}
    </div>
  );
}
