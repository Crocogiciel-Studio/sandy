import './app.css';
import { useState } from 'react';
import type { SandboxSummary, StartSessionResult } from '../../contracts/api';
import { LaunchSession, type LaunchRequest } from '../features/sessions/LaunchSession';
import { Sidebar, STATE_TEXT, sessionState, type OpenSession } from '../features/sessions/Sidebar';
import { openTerminal, Terminal } from '../features/terminal/Terminal';

const NEW = 'new';

export function App() {
  const [running, setRunning] = useState<OpenSession[]>([]);
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
    (id, activity) => setRunning((all) => all.map((one) => (one.session.id === id ? { ...one, activity } : one))),
    );
    if (!result.ok) return setError(result.message);
    // Two sessions of the same agent on the same project must stay tellable apart.
    setRunning((all) => {
      const base = agent;
      const same = all.filter((one) => one.projectPath === projectPath && (one.label === base || one.label.startsWith(`${base} (`))).length;
      return [...all, { label: same ? `${base} (${same + 1})` : base, projectPath, session: result.session }];
    });
    setActive(result.session.id);
  }

  const launch = ({ agent, projectPath }: LaunchRequest): Promise<void> =>
    open(agent, projectPath, (cols, rows) => window.sandy.session.start({ agent, projectPath, cols, rows }));

  const attach = ({ name, agent, workspaces }: SandboxSummary): Promise<void> =>
    open(agent, workspaces[0] ?? name, (cols, rows) => window.sandy.session.attach({ name, cols, rows }));

  function close(one: OpenSession): void {
    window.sandy.terminal.close(one.session.id);
    one.session.dispose();
    const remaining = running.filter((other) => other !== one);
    setRunning(remaining);
    if (active === one.session.id) setActive(remaining.at(-1)?.session.id ?? NEW);
  }

  function select(id: string): void {
    if (id === NEW) setError(undefined);
    setActive(id);
  }

  return (
    <div className="app">
      <Sidebar sessions={running} active={active} newSessionId={NEW} onSelect={select} onClose={close} onAttach={attach} />
      <main className="main">
        {running.map((one) => (
          <Terminal
            key={one.session.id}
            session={one.session}
            visible={active === one.session.id}
            ended={one.exitCode !== undefined}
            title={one.label}
            projectPath={one.projectPath}
            state={sessionState(one)}
            stateText={STATE_TEXT[sessionState(one)](one)}
          />
        ))}
        {active === NEW && <LaunchSession onLaunch={launch} error={error} />}
      </main>
    </div>
  );
}
