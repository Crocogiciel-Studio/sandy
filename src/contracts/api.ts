// The API the preload exposes to the renderer as `window.sandy`.
export interface SandyApi {
  terminal: TerminalApi;
  session: SessionApi;
  files: FilesApi;
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
  // Makes dropped host files reachable by the session's agent; resolves with the paths to type.
  prepareDrop(id: string, hostPaths: string[]): Promise<PrepareDropResult>;
  // Same for a clipboard image (png, jpeg, gif or webp): resolves with the sandbox path to type.
  pasteImage(id: string, image: ArrayBuffer, mimeType: string): Promise<PrepareDropResult>;
}

export interface FilesApi {
  // Absolute host paths of dropped files; empty entries (files not backed by disk) are omitted.
  pathsFor(files: File[]): string[];
}

export interface StartSessionRequest {
  agent: string;
  projectPath: string;
  cols: number;
  rows: number;
}

export type StartSessionResult = { ok: true; id: string } | { ok: false; message: string };

export type PrepareDropResult = { ok: true; paths: string[] } | { ok: false; message: string };
