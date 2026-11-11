import { execFile } from 'node:child_process';
import { delimiter } from 'node:path';

const MARK = '__SANDY_PATH__';
const TIMEOUT_MS = 5_000;

// Rc files may print banners: only the text between the markers is the PATH.
export function parseLoginPath(output: string): string | undefined {
  const match = new RegExp(`${MARK}(.*?)${MARK}`, 's').exec(output);
  return match?.[1]?.trim() || undefined;
}

// The login shell's PATH first, then the current one: entries are kept, duplicates dropped.
export function mergePaths(loginPath: string, currentPath: string): string {
  return [...new Set([...loginPath.split(delimiter), ...currentPath.split(delimiter)].filter(Boolean))].join(delimiter);
}

// A Dock-launched macOS app has a minimal PATH, so tools found by the user's shell (e.g. the
// docker-credential-desktop that sbx runs) are missing. Adopt the login shell's PATH once at startup.
export async function adoptLoginPath(): Promise<void> {
  if (process.platform === 'win32') return;
  const shell = process.env['SHELL'] || '/bin/zsh';
  const loginPath = await new Promise<string | undefined>((resolve) => {
    execFile(shell, ['-ilc', `printf '%s' "${MARK}$PATH${MARK}"`], { timeout: TIMEOUT_MS }, (error, stdout) => resolve(error ? undefined : parseLoginPath(stdout)));
  });
  if (loginPath) process.env['PATH'] = mergePaths(loginPath, process.env['PATH'] ?? '');
}
