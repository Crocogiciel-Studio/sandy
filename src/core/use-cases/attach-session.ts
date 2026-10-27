import type { SandboxInfo, SandboxProvider } from '../ports/sandbox-provider';
import type { TerminalProvider } from '../ports/terminal-provider';

export interface AttachSession {
  name: string;
  cols: number;
  rows: number;
}

// Re-attaches the agent of an existing sandbox in a new terminal.
// The sandbox comes from `sbx ls`, never from the caller, so its workspace is trusted.
export async function attachSession(
  deps: { sandbox: SandboxProvider; terminal: TerminalProvider },
  { name, cols, rows }: AttachSession,
): Promise<{ id: string; sandbox: SandboxInfo }> {
  // Names of sandboxes made elsewhere follow no rule of ours; only an option-like name is refused.
  if (!name || name.startsWith('-')) throw new Error(`Nom de sandbox invalide : ${name}`);
  const sandbox = (await deps.sandbox.list()).find((one) => one.name === name);
  if (!sandbox) throw new Error(`Sandbox introuvable : ${name}`);
  const cwd = sandbox.workspaces[0];
  if (!cwd) throw new Error(`La sandbox ${name} n'a pas de workspace.`);
  const { command, args } = deps.sandbox.attachCommand(name);
  return { id: await deps.terminal.open({ command, args, cwd, cols, rows }), sandbox };
}
