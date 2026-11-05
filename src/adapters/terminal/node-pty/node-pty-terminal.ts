import { randomUUID } from 'node:crypto';
import type { HostMessage, PtyRequest } from '../../../contracts/pty-messages';
import { CommandNotFoundError, type TerminalOptions, type TerminalProvider } from '../../../core/ports/terminal-provider';
import type { HostPaths } from '../../../pty-host/paths';
import type { HostConnection } from './host-client';
import { connectToHost } from './host-launcher';

type Pending = { resolve: (id: string) => void; reject: (error: Error) => void; command: string };

// TerminalProvider backed by the detached pty-host, so a native crash never takes the app down.
export class NodePtyTerminal implements TerminalProvider {
  private connection?: HostConnection;
  private connecting?: Promise<HostConnection>;
  private readonly pending = new Map<string, Pending>();
  private readonly running = new Set<string>();
  private readonly dataListeners = new Set<(id: string, data: string) => void>();
  private readonly exitListeners = new Set<(id: string, exitCode: number) => void>();

  constructor(
    private readonly hostPath: string,
    private readonly paths: HostPaths,
  ) {}

  open({ command, args, cwd, cols, rows }: TerminalOptions): Promise<string> {
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, command });
      const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
      this.connect().then(
        (connection) => connection.send({ type: 'open', id, command, args: [...args], cwd, cols, rows, env }),
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

  runningCount(): number {
    return this.running.size;
  }

  closeAll(): void {
    for (const id of this.running) this.close(id);
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

  private connect(): Promise<HostConnection> {
    this.connecting ??= connectToHost(this.paths, this.hostPath).then(
      (connection) => {
        this.connection = connection;
        connection.onMessage((message) => this.handle(message));
        connection.onClose(() => this.lost());
        return connection;
      },
      (error: unknown) => {
        this.connecting = undefined;
        throw error;
      },
    );
    return this.connecting;
  }

  private lost(): void {
    this.connection = undefined;
    this.connecting = undefined;
    for (const [id, { reject }] of this.pending) {
      this.pending.delete(id);
      reject(new Error('The terminal host disconnected.'));
    }
    for (const id of this.running) this.handle({ type: 'exit', id, exitCode: -1 });
  }

  private handle(event: HostMessage): void {
    if (event.type === 'data') {
      this.dataListeners.forEach((listener) => listener(event.id, event.data));
    } else if (event.type === 'exit') {
      this.running.delete(event.id);
      this.exitListeners.forEach((listener) => listener(event.id, event.exitCode));
    } else if (event.type === 'hello-ok' || event.type === 'hello-refused') {
      return;
    } else {
      const pending = this.pending.get(event.id);
      this.pending.delete(event.id);
      if (event.type === 'opened') {
        this.running.add(event.id);
        pending?.resolve(event.id);
      } else if (event.reason === 'command-not-found') {
        pending?.reject(new CommandNotFoundError(pending.command));
      } else {
        pending?.reject(new Error(event.message));
      }
    }
  }
}
