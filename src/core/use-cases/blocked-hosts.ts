import { activeBlockedHosts, isAllowableHost } from '../domain/blocked-domain';
import type { SandboxProvider } from '../ports/sandbox-provider';
import { findSandbox } from './find-sandbox';

// The hosts the sandbox's agent tried to reach since `since` (epoch ms) and sbx still blocks.
// `allowed` are hosts allowed from sandy since: the log lists them as blocked until the agent retries.
export async function listBlockedHosts(
  sandbox: SandboxProvider,
  name: string,
  since: number,
  allowed: ReadonlySet<string> = new Set(),
): Promise<string[]> {
  await findSandbox(sandbox, name);
  return activeBlockedHosts(await sandbox.policyLog(name), since).filter((host) => !allowed.has(host));
}

// Allows a host for this sandbox only, and only if it is blocked right now: the caller cannot invent a rule.
export async function allowBlockedHost(
  sandbox: SandboxProvider,
  { name, host, since, allowed }: { name: string; host: string; since: number; allowed?: ReadonlySet<string> },
): Promise<void> {
  if (!isAllowableHost(host)) throw new Error(`Invalid host: ${host}`);
  if (!(await listBlockedHosts(sandbox, name, since, allowed)).includes(host)) throw new Error(`${host} is not blocked for this sandbox.`);
  await sandbox.allowHost({ name, host });
}
