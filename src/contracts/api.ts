// The API the preload exposes to the renderer as `window.sandy`.
export interface SandyApi {
  terminal: TerminalApi;
  session: SessionApi;
}

export interface TerminalApi {
  write(id: string, data: string): void;
  resize(id: string, cols: number, rows: number): void;
  close(id: string): void;
  onData(listener: (id: string, data: string) => void): () => void;
  onExit(listener: (id: string, exitCode: number) => void): () => void;
}

export interface SessionApi {
  pickProject(): Promise<string | undefined>;
  listAgents(): Promise<string[]>;
  start(request: StartSessionRequest): Promise<StartSessionResult>;
}

export interface StartSessionRequest {
  agent: string;
  projectPath: string;
  cols: number;
  rows: number;
}

export type StartSessionResult = { ok: true; id: string } | { ok: false; message: string };
