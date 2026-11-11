import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

// A Dock-launched macOS app gets a minimal PATH without the usual install dirs.
// ~/.docker/bin holds docker-credential-desktop, which sbx runs to pull kits from ghcr.io.
export function searchDirs(env: NodeJS.ProcessEnv = process.env): string[] {
  const extra = process.platform === 'win32' ? [] : ['/opt/homebrew/bin', '/usr/local/bin', join(homedir(), '.local/bin'), join(homedir(), '.docker/bin')];
  return [...(env['PATH'] ?? '').split(delimiter).filter(Boolean), ...extra];
}
