import type { PolicyEntry, PolicyLog } from '../../../core/domain/blocked-domain';

// `sbx policy log --json` is undocumented: this reads only `host` and `last_seen` of each entry
// (shape observed on v0.51), and drops entries that lack them.
export function parsePolicyLog(json: string): PolicyLog {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('sbx policy log --json: unreadable output.');
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('sbx policy log --json: expected an object.');
  const { allowed, blocked } = data as Record<string, unknown>;
  return { allowed: entries(allowed), blocked: entries(blocked) };
}

function entries(list: unknown): PolicyEntry[] {
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const { host, last_seen: lastSeen } = entry as Record<string, unknown>;
    const time = typeof lastSeen === 'string' ? Date.parse(lastSeen) : NaN;
    return typeof host === 'string' && !Number.isNaN(time) ? [{ host, lastSeen: time }] : [];
  });
}
