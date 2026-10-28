import type { SandboxProvider } from '../ports/sandbox-provider';
import type { TerminalProvider } from '../ports/terminal-provider';

export interface StartSignIn {
  cwd: string;
  cols: number;
  rows: number;
}

// Opens a terminal on `sbx login`, which may print a code or ask for Enter, and resolves with the terminal id.
// sandy never sees a password: the sign-in happens in the user's browser.
export async function startSignIn(
  deps: { sandbox: SandboxProvider; terminal: TerminalProvider },
  { cwd, cols, rows }: StartSignIn,
): Promise<string> {
  const { command, args } = deps.sandbox.signInCommand();
  return deps.terminal.open({ command, args, cwd, cols, rows });
}
