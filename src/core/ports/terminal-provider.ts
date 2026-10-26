export interface TerminalOptions {
  command: string;
  args: readonly string[];
  cwd: string;
  cols: number;
  rows: number;
}

export interface TerminalProvider {
  // Resolves with the terminal id once the process runs; rejects if it cannot start.
  open(options: TerminalOptions): Promise<string>;
  write(id: string, data: string): void;
  resize(id: string, cols: number, rows: number): void;
  close(id: string): void;
  onData(listener: (id: string, data: string) => void): () => void;
  onExit(listener: (id: string, exitCode: number) => void): () => void;
}

export class CommandNotFoundError extends Error {
  constructor(readonly command: string) {
    super(`Command not found: ${command}`);
    this.name = 'CommandNotFoundError';
  }
}
