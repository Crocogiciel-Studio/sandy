import type { SandboxProvider } from '../ports/sandbox-provider';
import { findSandbox } from './find-sandbox';

// Stops a sandbox, keeping it so it can be re-attached later.
export async function stopSandbox(sandbox: SandboxProvider, name: string): Promise<void> {
  await findSandbox(sandbox, name);
  await sandbox.stop(name);
}

// Deletes a sandbox for good, running or not.
export async function removeSandbox(sandbox: SandboxProvider, name: string): Promise<void> {
  await findSandbox(sandbox, name);
  await sandbox.remove(name);
}
