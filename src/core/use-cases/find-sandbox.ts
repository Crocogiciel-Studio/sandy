import type { SandboxInfo, SandboxProvider } from '../ports/sandbox-provider';

// Resolves a caller-supplied name to a sandbox `sbx ls` really reports.
// Names of sandboxes made elsewhere follow no rule of ours; only an option-like name is refused.
export async function findSandbox(sandbox: SandboxProvider, name: string): Promise<SandboxInfo> {
  if (!name || name.startsWith('-')) throw new Error(`Nom de sandbox invalide : ${name}`);
  const found = (await sandbox.list()).find((one) => one.name === name);
  if (!found) throw new Error(`Sandbox introuvable : ${name}`);
  return found;
}
