import { useEffect, useRef } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import type { StartSessionResult } from '../../../contracts/api';

export interface TerminalSession {
  id: string;
  xterm: XTerm;
  fit: FitAddon;
}

// Starts a session and wires it to a fresh xterm before any output can be missed.
// The xterm lives outside React so StrictMode remounts do not lose output.
export async function openTerminal(
  start: (cols: number, rows: number) => Promise<StartSessionResult>,
  onExit: (exitCode: number) => void,
): Promise<{ ok: true; session: TerminalSession } | { ok: false; message: string }> {
  const { terminal } = window.sandy;
  const xterm = new XTerm({ cursorBlink: true, fontFamily: 'Menlo, Consolas, "DejaVu Sans Mono", monospace' });
  const fit = new FitAddon();
  xterm.loadAddon(fit);

  const started: { id?: string } = {};
  const early: Array<() => void> = [];
  const route = (eventId: string, deliver: () => void): void => {
    if (started.id === undefined) early.push(() => eventId === started.id && deliver());
    else if (eventId === started.id) deliver();
  };
  const offData = terminal.onData((eventId, data) => route(eventId, () => xterm.write(data)));
  const offExit = terminal.onExit((eventId, exitCode) =>
    route(eventId, () => {
      offData();
      offExit();
      onExit(exitCode);
    }),
  );

  const result = await start(xterm.cols, xterm.rows);
  if (!result.ok) {
    offData();
    offExit();
    xterm.dispose();
    return result;
  }
  started.id = result.id;
  early.splice(0).forEach((deliver) => deliver());
  xterm.onData((data) => terminal.write(result.id, data));
  xterm.onResize(({ cols, rows }) => terminal.resize(result.id, cols, rows));
  return { ok: true, session: { id: result.id, xterm, fit } };
}

export function Terminal({ session }: { session: TerminalSession }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    if (!session.xterm.element) session.xterm.open(element);
    session.fit.fit();
    session.xterm.focus();
    const observer = new ResizeObserver(() => session.fit.fit());
    observer.observe(element);
    return () => observer.disconnect();
  }, [session]);

  return <div ref={container} style={{ flex: 1, minHeight: 0, background: '#000', padding: 4 }} />;
}
