import { randomUUID } from 'node:crypto';
import { utilityProcess, type UtilityProcess } from 'electron';
import type { PtyEvent, PtyRequest } from '../../../contracts/pty-messages';
import { CommandNotFoundError, type TerminalOptions, type TerminalProvider } from '../../../core/ports/terminal-provider';

type Pending = { resolve: (id: string) => void; reject: (error: Error) => void; command: string };

// TerminalProvider backed by the pty-host utilityProcess, so a native crash never takes the app down.
export class NodePtyTerminal implements TerminalProvider {
  private host?: UtilityProcess;
  private readonly pending = new Map<string, Pending>();
  private readonly running = new Set<string>();
  private readonly dataListeners = new Set<(id: string, data: string) => void>();
  private readonly exitListeners = new Set<(id: string, exitCode: number) => void>();

  constructor(private readonly hostPath: string) {}

  open({ command, args, cwd, cols, rows }: TerminalOptions): Promise<string> {
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, command });
      this.send({ type: 'open', id, command, args: [...args], cwd, cols, rows }, true);
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

  closeAll(): void {
    for (const id of this.running) this.close(id);
  }

  dispose(): void {
    this.closeAll();
    this.host?.kill();
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
  private send(request: PtyRequest, startIfNeeded = false): void {
    if (startIfNeeded) this.host ??= this.startHost();
    this.host?.postMessage(request);
  }

  private startHost(): UtilityProcess {
    const host = utilityProcess.fork(this.hostPath, [], { serviceName: 'sandy pty-host' });
    host.on('message', (event: PtyEvent) => this.handle(event));
    host.on('exit', (code) => {
      this.host = undefined;
      for (const [id, { reject }] of this.pending) {
        this.pending.delete(id);
        reject(new Error(`pty-host exited (code ${code})`));
      }
      for (const id of this.running) this.handle({ type: 'exit', id, exitCode: -1 });
    });
    return host;
  }

  private handle(event: PtyEvent): void {
    if (event.type === 'data') {
      this.dataListeners.forEach((listener) => listener(event.id, event.data));
    } else if (event.type === 'exit') {
      this.running.delete(event.id);
      this.exitListeners.forEach((listener) => listener(event.id, event.exitCode));
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
