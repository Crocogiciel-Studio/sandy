import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import type { PtyEvent, PtyRequest } from '../contracts/pty-messages';
import { createPtyHost } from './index';

function startHost() {
  const events: PtyEvent[] = [];
  const waiters: Array<() => void> = [];
  const handle = createPtyHost((event) => {
    events.push(event);
    waiters.splice(0).forEach((wake) => wake());
  });
  const output = () =>
    events.flatMap((event) => (event.type === 'data' ? [event.data] : [])).join('');
  async function waitFor<T>(find: () => T | undefined, timeoutMs = 5000): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const found = find();
      if (found !== undefined) return found;
      if (Date.now() > deadline) throw new Error(`Timed out; output so far: ${JSON.stringify(output())}`);
      await new Promise<void>((wake) => {
        waiters.push(wake);
        setTimeout(wake, 50);
      });
    }
  }
  const open = (id: string, script: string, size = { cols: 80, rows: 24 }): void =>
    handle({ type: 'open', id, command: 'node', args: ['-e', script], cwd: tmpdir(), ...size });
  const send = (request: PtyRequest): void => handle(request);
  const exitCode = (id: string) =>
    waitFor(() => events.find((event) => event.type === 'exit' && event.id === id)).then((event) =>
      event.type === 'exit' ? event.exitCode : undefined,
    );
  return { events, output, waitFor, open, send, exitCode };
}

describe('pty-host', () => {
  it('streams the command output', async () => {
    const host = startHost();
    host.open('a', 'console.log("hello from pty")');

    expect(await host.exitCode('a')).toBe(0);
    expect(host.events[0]).toEqual({ type: 'opened', id: 'a' });
    expect(host.output()).toContain('hello from pty');
  });

  it('forwards input to the command and echoes it back', async () => {
    const host = startHost();
    host.open('a', 'process.stdin.on("data", (d) => { console.log("got:" + d.toString().trim()); process.exit(0); })');
    await host.waitFor(() => host.events.find((event) => event.type === 'opened'));

    host.send({ type: 'write', id: 'a', data: 'ping\r' });

    expect(await host.exitCode('a')).toBe(0);
    expect(host.output()).toContain('got:ping');
  });

  it('resizes the pty', async () => {
    const host = startHost();
    host.open(
      'a',
      'setInterval(() => {}, 1000); console.log("size:" + process.stdout.columns + "x" + process.stdout.rows); process.stdout.on("resize", () => { console.log("size:" + process.stdout.columns + "x" + process.stdout.rows); process.exit(0); })',
    );
    await host.waitFor(() => (host.output().includes('size:80x24') ? true : undefined));

    host.send({ type: 'resize', id: 'a', cols: 120, rows: 40 });

    expect(await host.exitCode('a')).toBe(0);
    expect(host.output()).toContain('size:120x40');
  });

  it('reports a non-zero exit code', async () => {
    const host = startHost();
    host.open('a', 'process.exit(3)');

    expect(await host.exitCode('a')).toBe(3);
  });

  it('reports a missing command without crashing', async () => {
    const host = startHost();
    host.send({ type: 'open', id: 'a', command: 'sandy-no-such-command', args: [], cwd: tmpdir(), cols: 80, rows: 24 });

    expect(host.events).toEqual([
      { type: 'open-failed', id: 'a', reason: 'command-not-found', message: 'Command not found: sandy-no-such-command' },
    ]);

    host.open('b', 'process.exit(0)');
    expect(await host.exitCode('b')).toBe(0);
  });
});
