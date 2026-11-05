import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openConnection } from './host-client';
import { createLineDecoder, encodeMessage } from '../../../contracts/framing';
import type { HostMessage } from '../../../contracts/pty-messages';
import { hostPaths } from '../../../pty-host/paths';
import { startHostServer, type HostServer } from '../../../pty-host/server';

const dirs: string[] = [];
const servers: HostServer[] = [];
afterEach(() => {
  servers.splice(0).forEach((server) => server.shutdown());
  dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});

async function start(idleExitMs = 30_000) {
  // Short directory: Unix socket paths are limited to ~100 characters.
  const dir = mkdtempSync(join(tmpdir(), 'sh-'));
  dirs.push(dir);
  const paths = hostPaths(dir);
  const closed = { value: false };
  const server = await startHostServer({ paths, idleExitMs, onClosed: () => (closed.value = true) });
  if (!server) throw new Error('server did not start');
  servers.push(server);
  return { paths, server, closed };
}

async function waitFor<T>(find: () => T | undefined, timeoutMs = 5000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = find();
    if (found !== undefined) return found;
    if (Date.now() > deadline) throw new Error('Timed out');
    await new Promise((wake) => setTimeout(wake, 20));
  }
}

async function client(paths: ReturnType<typeof hostPaths>) {
  const connection = await openConnection(paths);
  if (!connection) throw new Error('no connection');
  const messages: HostMessage[] = [];
  connection.onMessage((message) => messages.push(message));
  return { connection, messages };
}

const SCRIPT = 'console.log("hello"); setInterval(() => undefined, 1000)';
const open = (id: string, extra = {}) => ({ type: 'open' as const, id, command: 'node', args: ['-e', SCRIPT], cwd: tmpdir(), cols: 80, rows: 24, ...extra });

describe('pty-host server', () => {
  it('drives a session end to end over the socket', async () => {
    const { paths } = await start();
    const { connection, messages } = await client(paths);

    connection.send(open('a'));
    await waitFor(() => messages.find((m) => m.type === 'data' && m.data.includes('hello')));
    connection.send({ type: 'close', id: 'a' });

    await waitFor(() => messages.find((m) => m.type === 'exit' && m.id === 'a'));
    expect(messages[0]).toEqual({ type: 'opened', id: 'a' });
  });

  it('refuses a wrong token and runs nothing', async () => {
    const { paths } = await start();
    const socket = connect(paths.socket);
    socket.setEncoding('utf8');
    const received: unknown[] = [];
    socket.on('data', createLineDecoder((message) => received.push(message)));
    socket.on('connect', () => socket.write(encodeMessage({ type: 'hello', token: 'nope', protocol: 1 }) + encodeMessage(open('a'))));

    await waitFor(() => received[0]);
    expect(received).toEqual([{ type: 'hello-refused' }]);
  });

  it('keeps a session running after its client disconnects', async () => {
    const { paths } = await start();
    const first = await client(paths);
    first.connection.send(open('a'));
    await waitFor(() => first.messages.find((m) => m.type === 'opened'));
    first.connection.close();
    await new Promise((wake) => setTimeout(wake, 100));

    const second = await client(paths);
    second.connection.send({ type: 'close', id: 'a' });

    await waitFor(() => second.messages.find((m) => m.type === 'exit' && m.id === 'a'));
  });

  it('uses the environment of the client', async () => {
    const { paths } = await start();
    const { connection, messages } = await client(paths);

    connection.send(open('a', { args: ['-e', 'console.log("env:" + process.env.SANDY_TEST_VALUE); process.exit(0)'], env: { PATH: process.env['PATH'] ?? '', SANDY_TEST_VALUE: 'from-client' } }));

    await waitFor(() => messages.find((m) => m.type === 'data' && m.data.includes('env:from-client')));
  });

  it('exits on its own when it holds no session and no client', async () => {
    const { paths, closed } = await start(150);

    await waitFor(() => (closed.value ? true : undefined));
    expect(existsSync(paths.token)).toBe(false);
  });

  it('does not exit while a client is connected', async () => {
    const { paths, closed } = await start(100);
    await client(paths);

    await new Promise((wake) => setTimeout(wake, 400));

    expect(closed.value).toBe(false);
  });

  it('kills sessions and removes its files on shutdown', async () => {
    const { paths, server, closed } = await start();
    const { connection, messages } = await client(paths);
    connection.send(open('a'));
    await waitFor(() => messages.find((m) => m.type === 'opened'));

    server.shutdown();

    expect(closed.value).toBe(true);
    expect(existsSync(paths.token)).toBe(false);
    if (process.platform !== 'win32') expect(existsSync(paths.socket)).toBe(false);
  });

  it('replaces the stale socket of a dead host', async () => {
    const first = await start();
    // Simulates a crash: the socket file stays, nothing listens.
    first.server.shutdown();
    const dir = first.paths.dir;
    const again = await startHostServer({ paths: hostPaths(dir), onClosed: () => undefined });
    expect(again).toBeDefined();
    again?.shutdown();
  });

  it('leaves a live host alone', async () => {
    const { paths } = await start();

    expect(await startHostServer({ paths, onClosed: () => undefined })).toBeUndefined();
  });

  it('lists live sessions with their metadata', async () => {
    const { paths } = await start();
    const first = await client(paths);
    first.connection.send(open('a', { meta: { sandboxName: 'claude-app', agent: 'claude' } }));
    await waitFor(() => first.messages.find((m) => m.type === 'opened'));
    first.connection.close();

    const second = await client(paths);
    second.connection.send({ type: 'list' });

    const reply = await waitFor(() => second.messages.find((m) => m.type === 'sessions'));
    expect(reply).toMatchObject({ sessions: [{ id: 'a', meta: { sandboxName: 'claude-app', agent: 'claude' } }] });
  });

  it('drops a session from the list once it has exited', async () => {
    const { paths } = await start();
    const { connection, messages } = await client(paths);
    connection.send(open('a', { args: ['-e', 'process.exit(0)'] }));
    await waitFor(() => messages.find((m) => m.type === 'exit'));

    connection.send({ type: 'list' });

    expect(await waitFor(() => messages.find((m) => m.type === 'sessions'))).toEqual({ type: 'sessions', sessions: [] });
  });

  it('sends the screen on attach, then the live data, in that order', async () => {
    const { paths } = await start();
    const first = await client(paths);
    first.connection.send(open('a', { args: ['-e', 'console.log("before"); process.stdin.on("data", (d) => console.log("echo:" + d.toString().trim()))'] }));
    await waitFor(() => first.messages.find((m) => m.type === 'data' && m.data.includes('before')));
    first.connection.close();

    const second = await client(paths);
    second.connection.send({ type: 'attach', id: 'a' });
    second.connection.send({ type: 'write', id: 'a', data: 'ping\r' });

    await waitFor(() => second.messages.find((m) => m.type === 'data' && m.data.includes('echo:ping')));
    const kinds = second.messages.map((m) => m.type);
    expect(kinds.indexOf('snapshot')).toBeGreaterThanOrEqual(0);
    expect(kinds.indexOf('snapshot')).toBeLessThan(kinds.indexOf('data'));
    const snapshot = second.messages.find((m) => m.type === 'snapshot');
    expect(snapshot).toMatchObject({ id: 'a', cols: 80, rows: 24 });
    expect(snapshot?.type === 'snapshot' && snapshot.data).toContain('before');
    expect(snapshot?.type === 'snapshot' && snapshot.data).not.toContain('echo:ping');
  });

  it('refuses to attach an unknown session', async () => {
    const { paths } = await start();
    const { connection, messages } = await client(paths);

    connection.send({ type: 'attach', id: 'nope' });

    expect(await waitFor(() => messages.find((m) => m.type === 'attach-failed'))).toEqual({ type: 'attach-failed', id: 'nope' });
  });
});
