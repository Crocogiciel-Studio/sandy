export interface TerminalOptions {
  command: string;
  args: readonly string[];
  cwd: string;
  cols: number;
  rows: number;
  // Opaque to the terminal: handed back by `list` so the caller can rebuild its sessions after a restart.
  meta?: Readonly<Record<string, string>>;
}

export interface LiveTerminal {
  id: string;
  meta: Readonly<Record<string, string>>;
  startedAt: number;
}

export interface TerminalScreen {
  cols: number;
  rows: number;
  // Escape sequences that redraw the screen in a terminal of that size.
  data: string;
}

export interface TerminalProvider {
  // Resolves with the terminal id once the process runs; rejects if it cannot start.
  open(options: TerminalOptions): Promise<string>;
  write(id: string, data: string): void;
  resize(id: string, cols: number, rows: number): void;
  close(id: string): void;
  // Terminals that kept running while the app was closed (or are running now).
  list(): Promise<LiveTerminal[]>;
  // The screen of a running terminal. Live data for it is delivered only after this resolves; rejects if it ended.
  attach(id: string): Promise<TerminalScreen>;
  onData(listener: (id: string, data: string) => void): () => void;
  onExit(listener: (id: string, exitCode: number) => void): () => void;
}

export class CommandNotFoundError extends Error {
  constructor(readonly command: string) {
    super(`Command not found: ${command}`);
    this.name = 'CommandNotFoundError';
  }
}
