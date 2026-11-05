import { randomUUID } from 'node:crypto';
import { PROTOCOL_VERSION, type HostMessage, type PtyRequest, type SessionInfo } from '../../../contracts/pty-messages';
import {
  CommandNotFoundError,
  type LiveTerminal,
  type TerminalOptions,
  type TerminalProvider,
  type TerminalScreen,
} from '../../../core/ports/terminal-provider';
import type { HostPaths } from '../../../pty-host/paths';
import { openConnection, type HostConnection } from './host-client';
import { connectToHost } from './host-launcher';

type Pending = { resolve: (id: string) => void; reject: (error: Error) => void; command: string };
type Attaching = { resolve: (screen: TerminalScreen) => void; reject: (error: Error) => void };

// TerminalProvider backed by the detached pty-host, so a native crash never takes the app down
// and sessions can outlive the app.
export class NodePtyTerminal implements TerminalProvider {
  private connection?: HostConnection;
  // A host from another version of the app: never driven, only offered to be stopped.
  private foreign?: HostConnection;
  private connecting?: Promise<HostConnection | undefined>;
  private readonly pending = new Map<string, Pending>();
  private readonly attaching = new Map<string, Attaching>();
  private readonly listing: Array<(sessions: SessionInfo[]) => void> = [];
  private readonly running = new Set<string>();
  // Sessions whose output the app may forward: opened here, or attached (their screen already sent).
  // Output of a listed session before its attach is in its screen: forwarding it too would draw it twice.
  private readonly bound = new Set<string>();
  private readonly attaches = new Map<string, Promise<TerminalScreen>>();
  private readonly dataListeners = new Set<(id: string, data: string) => void>();
  private readonly exitListeners = new Set<(id: string, exitCode: number) => void>();

  constructor(
    private readonly hostPath: string,
    private readonly paths: HostPaths,
  ) {}

  open({ command, args, cwd, cols, rows, meta }: TerminalOptions): Promise<string> {
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, command });
      const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
      this.start().then(
        (connection) => connection.send({ type: 'open', id, command, args: [...args], cwd, cols, rows, env, meta: { ...meta } }),
        (error: unknown) => {
          this.pending.delete(id);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }

  write(id: string, data: string): void {
    this.send({ type: 'write', id, data });
  }

  resize(id: string, cols: number, rows: number): void {
    this.send({ type: 'resize', id, cols, rows });
  }

  close(id: string): void {
    this.send({ type: 'close', id });
  }

  // Never starts a host: with none running there is nothing to list.
  async list(): Promise<LiveTerminal[]> {
    const connection = await this.reuse();
    if (!connection) return [];
    const sessions = await new Promise<SessionInfo[]>((resolve) => {
      this.listing.push(resolve);
      connection.send({ type: 'list' });
    });
    for (const { id } of sessions) this.running.add(id);
    return sessions;
  }

  async attach(id: string): Promise<TerminalScreen> {
    const connection = await this.reuse();
    if (!connection) throw new Error('The terminal host is not running.');
    // One attach at a time per session: a second would replace the first one's queue on the host.
    const running = this.attaches.get(id);
    if (running) return running;
    this.bound.delete(id);
    const attach = new Promise<TerminalScreen>((resolve, reject) => {
      this.attaching.set(id, { resolve, reject });
      connection.send({ type: 'attach', id });
    }).finally(() => this.attaches.delete(id));
    this.attaches.set(id, attach);
    return attach;
  }

  runningCount(): number {
    return this.running.size;
  }

  closeAll(): void {
    for (const id of this.running) this.close(id);
  }

  // Whether a host from an earlier launch speaks this version. Call once at startup, before any session.
  async inspectHost(): Promise<'none' | 'compatible' | 'foreign'> {
    const connection = await openConnection(this.paths);
    if (!connection) return 'none';
    if (connection.hostProtocol === PROTOCOL_VERSION) {
      this.connecting = Promise.resolve(connection);
      this.adopt(connection);
      return 'compatible';
    }
    this.foreign = connection;
    return 'foreign';
  }

  // Ends the sessions of a host from another version. Resolves once it is gone, so a new one can take its place.
  async stopForeignHost(): Promise<void> {
    const foreign = this.foreign;
    this.foreign = undefined;
    if (!foreign) return;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 3000);
      foreign.onClose(() => {
        clearTimeout(timer);
        resolve();
      });
      foreign.send({ type: 'shutdown' });
    });
  }

  // Quitting while leaving every session running: the host keeps them.
  disconnect(): void {
    this.connection?.close();
  }

  // Stops every session and the host itself.
  dispose(): void {
    this.connection?.send({ type: 'shutdown' });
    this.connection?.close();
  }

  onData(listener: (id: string, data: string) => void): () => void {
    this.dataListeners.add(listener);
    return () => this.dataListeners.delete(listener);
  }

  onExit(listener: (id: string, exitCode: number) => void): () => void {
    this.exitListeners.add(listener);
    return () => this.exitListeners.delete(listener);
  }

  // Only `open` may start the host: a stray write/close must not respawn it after a crash or at shutdown.
  private send(request: PtyRequest): void {
    this.connection?.send(request);
  }

  // The running host, if any.
  private reuse(): Promise<HostConnection | undefined> {
    this.connecting ??= openConnection(this.paths).then((connection) => {
      if (connection && connection.hostProtocol !== PROTOCOL_VERSION) {
        connection.close();
        this.connecting = undefined;
        return undefined;
      }
      if (!connection) this.connecting = undefined;
      else this.adopt(connection);
      return connection;
    });
    return this.connecting;
  }

  // The running host, started first when none answers.
  private async start(): Promise<HostConnection> {
    const existing = await this.reuse();
    if (existing) return existing;
    this.connecting ??= connectToHost(this.paths, this.hostPath).then(
      (connection) => {
        this.adopt(connection);
        return connection;
      },
      (error: unknown) => {
        this.connecting = undefined;
        throw error;
      },
    );
    return (await this.connecting) as HostConnection;
  }

  private adopt(connection: HostConnection): void {
    this.connection = connection;
    connection.onMessage((message) => this.handle(message));
    connection.onClose(() => this.lost());
  }

  private lost(): void {
    this.connection = undefined;
    this.connecting = undefined;
    const error = new Error('The terminal host disconnected.');
    for (const [id, { reject }] of this.pending) {
      this.pending.delete(id);
      reject(error);
    }
    for (const [id, { reject }] of this.attaching) {
      this.attaching.delete(id);
      reject(error);
    }
    this.listing.splice(0).forEach((resolve) => resolve([]));
    for (const id of this.running) this.handle({ type: 'exit', id, exitCode: -1 });
  }

  private handle(event: HostMessage): void {
    switch (event.type) {
      case 'hello-ok':
      case 'hello-refused':
        return;
      case 'data':
        if (!this.bound.has(event.id)) return;
        this.dataListeners.forEach((listener) => listener(event.id, event.data));
        return;
      case 'exit':
        this.running.delete(event.id);
        this.bound.delete(event.id);
        this.exitListeners.forEach((listener) => listener(event.id, event.exitCode));
        return;
      case 'sessions':
        this.listing.shift()?.(event.sessions);
        return;
      case 'snapshot': {
        const attaching = this.attaching.get(event.id);
        this.attaching.delete(event.id);
        this.bound.add(event.id);
        attaching?.resolve({ cols: event.cols, rows: event.rows, data: event.data });
        return;
      }
      case 'attach-failed': {
        const attaching = this.attaching.get(event.id);
        this.attaching.delete(event.id);
        attaching?.reject(new Error('That session has ended.'));
        return;
      }
      case 'opened': {
        const pending = this.pending.get(event.id);
        this.pending.delete(event.id);
        this.running.add(event.id);
        this.bound.add(event.id);
        pending?.resolve(event.id);
        return;
      }
      case 'open-failed': {
        const pending = this.pending.get(event.id);
        this.pending.delete(event.id);
        if (event.reason === 'command-not-found') pending?.reject(new CommandNotFoundError(pending.command));
        else pending?.reject(new Error(event.message));
      }
    }
  }
}
