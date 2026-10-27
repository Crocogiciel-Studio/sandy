import type { SandboxInfo } from '../../../core/ports/sandbox-provider';

// `sbx ls --json` is undocumented: this reads only the fields sandy needs (shape observed on v0.49+)
// and drops entries that lack them, so a new field or a half-written entry never breaks the list.
export function parseSandboxList(json: string): SandboxInfo[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('sbx ls --json : sortie illisible.');
  }
  if (!Array.isArray(data)) throw new Error('sbx ls --json : tableau attendu.');
  return data.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { name, agent, status, workspaces, last_used_at: lastUsedAt } = entry as Record<string, unknown>;
    if (typeof name !== 'string' || typeof agent !== 'string' || typeof status !== 'string') return [];
    const paths = Array.isArray(workspaces) ? workspaces.filter((path): path is string => typeof path === 'string') : [];
    return [{ name, agent, status, workspaces: paths, ...(typeof lastUsedAt === 'string' && { lastUsedAt }) }];
  });
}
