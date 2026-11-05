import { spawn } from 'node:child_process';
import type { HostPaths } from '../../../pty-host/paths';
import { openConnection, type HostConnection } from './host-client';

const START_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 100;

// Connects to the running pty-host, starting a detached one first if none answers.
// The host is the Electron binary run as plain Node: it outlives the app, which is the point.
export async function connectToHost(paths: HostPaths, hostPath: string): Promise<HostConnection> {
  const deadline = Date.now() + START_TIMEOUT_MS;
  let started = false;
  for (;;) {
    const connection = await openConnection(paths);
    if (connection) return connection;
    if (!started) {
      started = true;
      const child = spawn(process.execPath, [hostPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', SANDY_PTY_HOST_DIR: paths.dir },
      });
      child.on('error', () => undefined);
      child.unref();
    }
    if (Date.now() > deadline) throw new Error('The terminal host did not start.');
    await new Promise((wake) => setTimeout(wake, RETRY_DELAY_MS));
  }
}
