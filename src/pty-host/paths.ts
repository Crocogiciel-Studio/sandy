import { readFileSync } from 'node:fs';
import { userInfo } from 'node:os';
import { join } from 'node:path';

export interface HostPaths {
  dir: string;
  socket: string;
  token: string;
}

// Unix: a socket in a private directory. Windows has no file modes for pipes: the token guards them.
export function hostPaths(dir: string): HostPaths {
  const user = userInfo().username.replace(/[^\w-]/g, '_');
  return {
    dir,
    socket: process.platform === 'win32' ? `\\\\.\\pipe\\sandy-pty-host-${user}` : join(dir, 'pty-host.sock'),
    token: join(dir, 'pty-host.token'),
  };
}

export function readToken(paths: HostPaths): string | undefined {
  try {
    return readFileSync(paths.token, 'utf8');
  } catch {
    return undefined;
  }
}
