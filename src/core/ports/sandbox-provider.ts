export interface SessionCommand {
  command: string;
  args: string[];
}

// A sandbox as `sbx` reports it, whoever created it.
export interface SandboxInfo {
  name: string;
  agent: string;
  status: string;
  workspaces: string[];
  lastUsedAt?: string;
}

export interface SandboxProvider {
  listAgents(): readonly string[];
  // Rejects when sandboxes cannot be listed (sbx missing, not signed in...).
  list(): Promise<SandboxInfo[]>;
  // Rejects when the copy fails.
  copyIn(request: { sandboxName: string; hostPath: string; sandboxPath: string }): Promise<void>;
  sessionCommand(request: { agent: string; projectPath: string; name: string }): SessionCommand;
  // Re-attaches the agent of an existing sandbox.
  attachCommand(name: string): SessionCommand;
}
