import { sessionName } from '../domain/session-name';
import type { SandboxProvider } from '../ports/sandbox-provider';
import type { TerminalProvider } from '../ports/terminal-provider';

export interface StartSession {
  agent: string;
  projectPath: string;
  cols: number;
  rows: number;
}

// Opens a terminal on the agent's sandbox session and resolves with the terminal id.
export async function startSession(
  deps: { sandbox: SandboxProvider; terminal: TerminalProvider },
  { agent, projectPath, cols, rows }: StartSession,
): Promise<string> {
  const name = sessionName(agent, projectPath);
  const { command, args } = deps.sandbox.sessionCommand({ agent, projectPath, name });
  return deps.terminal.open({ command, args, cwd: projectPath, cols, rows });
}
