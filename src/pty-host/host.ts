import { accessSync, constants, statSync } from 'node:fs';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import { spawn, type IPty } from 'node-pty';
import type { PtyEvent, PtyRequest, SessionInfo } from '../contracts/pty-messages';
import { createScreen, type Screen, type ScreenSnapshot } from './screen';
import { searchDirs } from './search-dirs';

const FLUSH_DELAY_MS = 8;

interface Session {
  pty: IPty;
  screen: Screen;
  meta: Record<string, string>;
  startedAt: number;
  buffer: string;
  timer?: NodeJS.Timeout;
}

export interface PtyHost {
  (request: PtyRequest): void;
  count(): number;
  list(): SessionInfo[];
  snapshot(id: string): Promise<ScreenSnapshot | undefined>;
  killAll(): void;
}

export function createPtyHost(send: (event: PtyEvent) => void): PtyHost {
  const sessions = new Map<string, Session>();

  function flush(id: string, session: Session): void {
    clearTimeout(session.timer);
    session.timer = undefined;
    if (session.buffer) {
      session.screen.write(session.buffer);
      send({ type: 'data', id, data: session.buffer });
    }
    session.buffer = '';
  }

  function open(request: Extract<PtyRequest, { type: 'open' }>): void {
    const { id, command, args, cwd, cols, rows } = request;
    // The client's environment, not the host's: the host outlives the app and would keep a stale PATH.
    const env = request.env ?? process.env;
    const file = findExecutable(command, cwd, env);
    if (!file) {
      send({ type: 'open-failed', id, reason: 'command-not-found', message: `Command not found: ${command}` });
      return;
    }
    // The child (sbx) runs helpers such as docker-credential-desktop from PATH: give it the same dirs we searched.
    const pathKey = Object.keys(env).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH';
    let pty: IPty;
    try {
      pty = spawn(file, args, { name: 'xterm-256color', cwd, cols, rows, env: { ...env, [pathKey]: searchDirs(env).join(delimiter), TERM: 'xterm-256color', COLORTERM: 'truecolor' } });
    } catch (error) {
      send({ type: 'open-failed', id, reason: 'spawn-error', message: String(error) });
      return;
    }
    const session: Session = { pty, buffer: '', screen: createScreen(cols, rows), meta: request.meta ?? {}, startedAt: Date.now() };
    sessions.set(id, session);
    send({ type: 'opened', id });
    pty.onData((data) => {
      session.buffer += data;
      session.timer ??= setTimeout(() => flush(id, session), FLUSH_DELAY_MS);
    });
    pty.onExit(({ exitCode }) => {
      flush(id, session);
      sessions.delete(id);
      session.screen.dispose();
      send({ type: 'exit', id, exitCode });
    });
  }

  const handle = (request: PtyRequest): void => {
    if (request.type === 'open') return open(request);
    const session = sessions.get(request.id);
    if (!session) return;
    if (request.type === 'write') session.pty.write(request.data);
    else if (request.type === 'resize') {
      session.pty.resize(request.cols, request.rows);
      session.screen.resize(request.cols, request.rows);
    }
    else session.pty.kill();
  };
  return Object.assign(handle, {
    count: () => sessions.size,
    list: () => [...sessions].map(([id, { meta, startedAt }]) => ({ id, meta, startedAt })),
    snapshot: async (id: string) => sessions.get(id)?.screen.snapshot(),
    killAll: () => sessions.forEach((session) => session.pty.kill()),
  });
}

// node-pty does not report a missing command on Unix (the child just exits 1), so resolve it upfront.
function findExecutable(command: string, cwd: string, env: NodeJS.ProcessEnv): string | undefined {
  const extensions = process.platform === 'win32' ? ['', ...(env['PATHEXT'] ?? '.EXE;.CMD;.BAT').split(';')] : [''];
  const candidates =
    command.includes('/') || command.includes('\\')
      ? [isAbsolute(command) ? command : resolve(cwd, command)]
      : searchDirs(env).map((dir) => join(dir, command));
  for (const candidate of candidates) {
    for (const extension of extensions) {
      const file = candidate + extension;
      if (isExecutable(file)) return file;
    }
  }
  return undefined;
}

function isExecutable(file: string): boolean {
  try {
    accessSync(file, constants.X_OK);
    return statSync(file).isFile();
  } catch {
    return false;
  }
}
