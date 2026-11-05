import { randomBytes, timingSafeEqual } from 'node:crypto';
import { chmodSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { connect, createServer, type Socket } from 'node:net';
import { createLineDecoder, encodeMessage } from '../contracts/framing';
import { PROTOCOL_VERSION, type ClientMessage, type HostMessage } from '../contracts/pty-messages';
import { createPtyHost } from './host';
import type { HostPaths } from './paths';

const HELLO_TIMEOUT_MS = 5000;
export const IDLE_EXIT_MS = 30_000;

export interface HostServer {
  // Kills every session, removes the socket and token files, then calls `onClosed`.
  shutdown(): void;
}

interface Options {
  paths: HostPaths;
  onClosed: () => void;
  idleExitMs?: number;
  // Only tests pass another version, to play an older host.
  protocol?: number;
}

// Serves the sessions over a socket. Sessions never depend on a client being connected.
// Resolves `undefined` when another host already answers on the socket.
export async function startHostServer({ paths, onClosed, idleExitMs = IDLE_EXIT_MS, protocol = PROTOCOL_VERSION }: Options): Promise<HostServer | undefined> {
  mkdirSync(paths.dir, { recursive: true, mode: 0o700 });
  if (process.platform !== 'win32') chmodSync(paths.dir, 0o700);
  if (await isAlive(paths.socket)) return undefined;
  // A dead host leaves its socket file behind: listening would fail on it.
  if (process.platform !== 'win32') rmSync(paths.socket, { force: true });

  const token = randomBytes(32).toString('hex');

  // `attaching`: sessions whose snapshot is not sent yet. Their live events wait, so a snapshot is never overtaken.
  interface Client {
    socket: Socket;
    attaching: Map<string, string[]>;
  }
  const clients = new Set<Client>();
  const broadcast = (message: HostMessage): void => {
    const line = encodeMessage(message);
    for (const client of clients) {
      const queue = 'id' in message ? client.attaching.get(message.id) : undefined;
      if (queue) queue.push(line);
      else client.socket.write(line);
    }
  };
  const attach = (client: Client, id: string): void => {
    client.attaching.set(id, []);
    void host.snapshot(id).then((snapshot) => {
      const queued = client.attaching.get(id) ?? [];
      client.attaching.delete(id);
      const reply: HostMessage = snapshot ? { type: 'snapshot', id, ...snapshot } : { type: 'attach-failed', id };
      client.socket.write(encodeMessage(reply));
      queued.forEach((line) => client.socket.write(line));
    });
  };
  const host = createPtyHost((event) => {
    broadcast(event);
    if (event.type === 'exit') queueMicrotask(checkIdle);
  });

  // A host with no session and nobody connected has no reason to live: it would be an orphan.
  let idleTimer: NodeJS.Timeout | undefined;
  function checkIdle(): void {
    const idle = clients.size === 0 && host.count() === 0;
    if (idle) idleTimer ??= setTimeout(() => shutdown(), idleExitMs);
    else {
      clearTimeout(idleTimer);
      idleTimer = undefined;
    }
  }

  const server = createServer((socket) => {
    socket.setEncoding('utf8');
    const client: Client = { socket, attaching: new Map() };
    let authenticated = false;
    const helloTimer = setTimeout(() => socket.destroy(), HELLO_TIMEOUT_MS);
    const decode = createLineDecoder((raw) => {
      const message = raw as ClientMessage;
      if (!authenticated) {
        if (message?.type === 'hello' && tokenMatches(message.token, token)) {
          authenticated = true;
          clearTimeout(helloTimer);
          clients.add(client);
          checkIdle();
          socket.write(encodeMessage({ type: 'hello-ok', protocol } satisfies HostMessage));
        } else {
          socket.end(encodeMessage({ type: 'hello-refused' } satisfies HostMessage));
        }
        return;
      }
      if (message.type === 'shutdown') shutdown();
      else if (message.type === 'list') socket.write(encodeMessage({ type: 'sessions', sessions: host.list() } satisfies HostMessage));
      else if (message.type === 'attach') {
        if (typeof message.id === 'string') attach(client, message.id);
      } else if (message.type !== 'hello') host(message);
    });
    socket.on('data', decode);
    socket.on('error', () => undefined);
    socket.on('close', () => {
      clearTimeout(helloTimer);
      clients.delete(client);
      checkIdle();
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(paths.socket, resolve);
  });
  if (process.platform !== 'win32') chmodSync(paths.socket, 0o600);
  // Only once listening: a host that lost the race for the socket must not overwrite the winner's token.
  writeFileSync(paths.token, token, { mode: 0o600 });
  checkIdle();

  let closed = false;
  function shutdown(): void {
    if (closed) return;
    closed = true;
    clearTimeout(idleTimer);
    host.killAll();
    clients.forEach((client) => client.socket.destroy());
    server.close();
    rmSync(paths.token, { force: true });
    if (process.platform !== 'win32') rmSync(paths.socket, { force: true });
    onClosed();
  }
  return { shutdown };
}

function tokenMatches(given: unknown, expected: string): boolean {
  if (typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isAlive(socketPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = connect(socketPath);
    probe.once('connect', () => {
      probe.destroy();
      resolve(true);
    });
    probe.once('error', () => resolve(false));
  });
}
