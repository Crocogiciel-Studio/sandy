import './app.css';
import { useState } from 'react';
import { LaunchSession, type LaunchRequest } from '../features/sessions/LaunchSession';
import { openTerminal, Terminal, type TerminalSession } from '../features/terminal/Terminal';

interface Running {
  title: string;
  session: TerminalSession;
}

export function App() {
  const [running, setRunning] = useState<Running>();
  const [error, setError] = useState<string>();
  const [exitCode, setExitCode] = useState<number>();

  async function launch({ agent, projectPath }: LaunchRequest): Promise<void> {
    setError(undefined);
    setExitCode(undefined);
    const result = await openTerminal(
      (cols, rows) => window.sandy.session.start({ agent, projectPath, cols, rows }),
      setExitCode,
    );
    if (!result.ok) return setError(result.message);
    const folder = projectPath.split(/[\\/]/).filter(Boolean).pop() ?? projectPath;
    setRunning({ title: `${agent} · ${folder}`, session: result.session });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 16, margin: 0, padding: '8px 16px', borderBottom: '1px solid #ccc' }}>sandy</h1>
      {running ? (
        <>
          <div style={{ padding: '4px 16px' }}>{running.title}</div>
          <Terminal session={running.session} />
          {exitCode !== undefined && (
            <p role="status" style={{ margin: 0, padding: '4px 16px' }}>
              Session terminée (code {exitCode})
            </p>
          )}
        </>
      ) : (
        <LaunchSession onLaunch={launch} error={error} />
      )}
    </div>
  );
}
