export interface SessionCommand {
  command: string;
  args: string[];
}

export interface SandboxProvider {
  listAgents(): readonly string[];
  sessionCommand(request: { agent: string; projectPath: string; name: string }): SessionCommand;
}
