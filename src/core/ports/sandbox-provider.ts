export interface SessionCommand {
  command: string;
  args: string[];
}

export interface SandboxProvider {
  listAgents(): readonly string[];
  // Rejects when the copy fails.
  copyIn(request: { sandboxName: string; hostPath: string; sandboxPath: string }): Promise<void>;
  sessionCommand(request: { agent: string; projectPath: string; name: string }): SessionCommand;
}
