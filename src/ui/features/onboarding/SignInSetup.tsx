import { useEffect, useRef, useState } from 'react';
import { openTerminal, type TerminalSession } from '../terminal/Terminal';

interface SignInSetupProps {
  checking: boolean;
  onRecheck: () => void;
}

// `sbx login` runs in an embedded terminal: it may print a code or wait for Enter, which only a terminal shows.
export function SignInSetup({ checking, onRecheck }: SignInSetupProps) {
  const [session, setSession] = useState<TerminalSession>();
  const [message, setMessage] = useState<string>();
  const [starting, setStarting] = useState(false);
  const screen = useRef<HTMLDivElement>(null);
  const live = useRef<TerminalSession | undefined>(undefined);

  async function signIn(): Promise<void> {
    setMessage(undefined);
    setStarting(true);
    // `sbx login` can end at once (already signed in): its exit may arrive before the terminal is registered below.
    let exited = false;
    const result = await openTerminal(
      (cols, rows) => window.sandy.sbx.signIn(cols, rows),
      (_id, exitCode) => {
        exited = true;
        live.current?.dispose();
        live.current = undefined;
        setSession(undefined);
        if (exitCode === 0) onRecheck();
        else setMessage(`Sign-in failed (code ${exitCode}).`);
      },
      () => undefined,
    );
    setStarting(false);
    if (!result.ok) return setMessage(result.message);
    if (exited) return result.session.dispose();
    live.current = result.session;
    setSession(result.session);
  }

  useEffect(() => {
    const element = screen.current;
    if (!session || !element) return;
    if (!session.xterm.element) session.xterm.open(element);
    session.fit.fit();
    session.xterm.focus();
    const observer = new ResizeObserver(() => session.fit.fit());
    observer.observe(element);
    return () => observer.disconnect();
  }, [session]);

  // Leaving the screen (signed in from another window) must not leave `sbx login` waiting.
  useEffect(
    () => () => {
      if (!live.current) return;
      window.sandy.terminal.close(live.current.id);
      live.current.dispose();
    },
    [],
  );

  return (
    <main className="setup">
      <h1>Docker sign-in required</h1>
      <p className="setup-problem" role="status">
        sbx is not signed in to Docker, which it needs to create sandboxes.
      </p>
      {session ? (
        <>
          <p>Follow the instructions below, then confirm in your browser.</p>
          <div ref={screen} className="setup-terminal" />
        </>
      ) : (
        <div className="setup-actions">
          <button type="button" className="primary" onClick={() => void signIn()} disabled={starting}>
            Sign in
          </button>
          <button type="button" onClick={onRecheck} disabled={checking}>
            Check again
          </button>
        </div>
      )}
      {message && (
        <p role="alert" className="setup-error">
          {message}
        </p>
      )}
    </main>
  );
}
