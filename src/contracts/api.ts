// The API the preload exposes to the renderer as `window.sandy`.
export interface SandyApi {
  terminal: TerminalApi;
  session: SessionApi;
  sbx: SbxApi;
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
  listSandboxes(): Promise<ListSandboxesResult>;
  // Closes the sandbox's open sessions first, then stops or deletes it.
  stopSandbox(name: string): Promise<ActionResult>;
  removeSandbox(name: string): Promise<ActionResult>;
  // Re-attaches the agent of an existing sandbox.
  attach(request: AttachSessionRequest): Promise<StartSessionResult>;
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

export interface SandboxSummary {
  name: string;
  agent: string;
  status: string;
  workspaces: string[];
  lastUsedAt?: string;
}

export type ListSandboxesResult = { ok: true; sandboxes: SandboxSummary[] } | { ok: false; message: string };

export interface AttachSessionRequest {
  name: string;
  cols: number;
  rows: number;
}

export type ActionResult = { ok: true } | { ok: false; message: string };

// Whether the `sbx` CLI can be used, apart from sign-in. `error`: sbx is there but would not report its version.
export type SbxStatus =
  | { status: 'ok'; version: string }
  | { status: 'missing' }
  | { status: 'outdated'; version: string; minimum: string }
  | { status: 'error'; message: string };

// Docker's install instructions for sbx. The shell opens this fixed address; the renderer never supplies one.
export const SBX_INSTALL_URL = 'https://docs.docker.com/ai/sandboxes/install/';

// Whether sbx is signed in to Docker. `unknown`: sbx could not tell, so sandy does not block on it.
export type SignInState = 'signed-in' | 'signed-out' | 'unknown';

export interface SbxApi {
  check(): Promise<SbxStatus>;
  checkSignIn(): Promise<SignInState>;
  // Opens a terminal on `sbx login` (browser OAuth); resolves with its id, closed like any session terminal.
  signIn(cols: number, rows: number): Promise<StartSessionResult>;
  // Opens SBX_INSTALL_URL in the browser.
  openInstallGuide(): Promise<void>;
  // The host OS (Node's process.platform), which picks the install instructions.
  platform: string;
}
