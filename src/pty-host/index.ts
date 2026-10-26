import { accessSync, constants, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import { spawn, type IPty } from 'node-pty';
import type { PtyEvent, PtyRequest } from '../contracts/pty-messages';

const FLUSH_DELAY_MS = 8;

interface Session {
  pty: IPty;
  buffer: string;
  timer?: NodeJS.Timeout;
}

export function createPtyHost(send: (event: PtyEvent) => void): (request: PtyRequest) => void {
  const sessions = new Map<string, Session>();

  function flush(id: string, session: Session): void {
    clearTimeout(session.timer);
    session.timer = undefined;
    if (session.buffer) send({ type: 'data', id, data: session.buffer });
    session.buffer = '';
  }

  function open(request: Extract<PtyRequest, { type: 'open' }>): void {
    const { id, command, args, cwd, cols, rows } = request;
    const file = findExecutable(command, cwd);
    if (!file) {
      send({ type: 'open-failed', id, reason: 'command-not-found', message: `Command not found: ${command}` });
      return;
    }
    let pty: IPty;
    try {
      pty = spawn(file, args, { name: 'xterm-256color', cwd, cols, rows, env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' } });
    } catch (error) {
      send({ type: 'open-failed', id, reason: 'spawn-error', message: String(error) });
      return;
    }
    const session: Session = { pty, buffer: '' };
    sessions.set(id, session);
    send({ type: 'opened', id });
    pty.onData((data) => {
      session.buffer += data;
      session.timer ??= setTimeout(() => flush(id, session), FLUSH_DELAY_MS);
    });
    pty.onExit(({ exitCode }) => {
      flush(id, session);
      sessions.delete(id);
      send({ type: 'exit', id, exitCode });
    });
  }

  return (request) => {
    if (request.type === 'open') return open(request);
    const session = sessions.get(request.id);
    if (!session) return;
    if (request.type === 'write') session.pty.write(request.data);
    else if (request.type === 'resize') session.pty.resize(request.cols, request.rows);
    else session.pty.kill();
  };
}

// node-pty does not report a missing command on Unix (the child just exits 1), so resolve it upfront.
function findExecutable(command: string, cwd: string): string | undefined {
  const extensions = process.platform === 'win32' ? ['', ...(process.env['PATHEXT'] ?? '.EXE;.CMD;.BAT').split(';')] : [''];
  const candidates =
    command.includes('/') || command.includes('\\')
      ? [isAbsolute(command) ? command : resolve(cwd, command)]
      : searchDirs().map((dir) => join(dir, command));
  for (const candidate of candidates) {
    for (const extension of extensions) {
      const file = candidate + extension;
      if (isExecutable(file)) return file;
    }
  }
  return undefined;
}

// A Dock-launched macOS app gets a minimal PATH without the usual install dirs.
function searchDirs(): string[] {
  const extra = process.platform === 'win32' ? [] : ['/opt/homebrew/bin', '/usr/local/bin', join(homedir(), '.local/bin')];
  return [...(process.env['PATH'] ?? '').split(delimiter).filter(Boolean), ...extra];
}

function isExecutable(file: string): boolean {
  try {
    accessSync(file, constants.X_OK);
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

if (process.parentPort) {
  const handle = createPtyHost((event) => process.parentPort.postMessage(event));
  process.parentPort.on('message', ({ data }: { data: PtyRequest }) => handle(data));
}
