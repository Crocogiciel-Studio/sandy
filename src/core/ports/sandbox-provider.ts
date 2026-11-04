export interface SessionCommand {
  command: string;
  args: string[];
}

// Whether sbx is signed in to Docker. `unknown`: sbx could not tell, so sandy does not block on it.
export type SignInState = 'signed-in' | 'signed-out' | 'unknown';

// A sandbox as `sbx` reports it, whoever created it.
export interface SandboxInfo {
  name: string;
  agent: string;
  status: string;
  workspaces: string[];
  lastUsedAt?: string;
}

export interface SandboxProvider {
  // The installed sbx version, or undefined when sbx is not installed. Rejects when sbx cannot report it.
  checkInstall(): Promise<{ version: string } | undefined>;
  // Never rejects: any failure to find out reads as `unknown`.
  checkSignIn(): Promise<SignInState>;
  // The interactive command that signs in (browser OAuth); it must run in a terminal.
  signInCommand(): SessionCommand;
  listAgents(): readonly string[];
  // Rejects when sandboxes cannot be listed (sbx missing, not signed in...).
  list(): Promise<SandboxInfo[]>;
  // Rejects when the copy fails.
  copyIn(request: { sandboxName: string; hostPath: string; sandboxPath: string }): Promise<void>;
  sessionCommand(request: { agent: string; projectPath: string; name: string }): SessionCommand;
  // Both reject when sbx fails.
  stop(name: string): Promise<void>;
  remove(name: string): Promise<void>;
  // Re-attaches the agent of an existing sandbox.
  attachCommand(request: { name: string; agent: string }): SessionCommand;
}
