import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

// A Dock-launched macOS app gets a minimal PATH without the usual install dirs.
export function searchDirs(): string[] {
  const extra = process.platform === 'win32' ? [] : ['/opt/homebrew/bin', '/usr/local/bin', join(homedir(), '.local/bin')];
  return [...(process.env['PATH'] ?? '').split(delimiter).filter(Boolean), ...extra];
}
