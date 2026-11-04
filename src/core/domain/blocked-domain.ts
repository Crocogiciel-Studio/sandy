// An entry of `sbx policy log`: `host` is `name[:port]` as sbx reports it, `lastSeen` is epoch milliseconds.
export interface PolicyEntry {
  host: string;
  lastSeen: number;
}

export interface PolicyLog {
  allowed: PolicyEntry[];
  blocked: PolicyEntry[];
}

// One exact hostname with an optional port: never a wildcard, a path, or anything sbx could read as an option.
const ALLOWABLE_HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d{1,5})?$/i;

export const isAllowableHost = (host: string): boolean => ALLOWABLE_HOST.test(host);

// The hosts a session is still blocked on: blocked after the session opened, and not allowed since.
// `blocked` is cumulative history, so older blocks must not resurface.
export function activeBlockedHosts(log: PolicyLog, since: number): string[] {
  const latestAllowed = new Map<string, number>();
  for (const { host, lastSeen } of log.allowed) latestAllowed.set(host, Math.max(lastSeen, latestAllowed.get(host) ?? 0));
  const hosts = log.blocked
    .filter(({ host, lastSeen }) => lastSeen > since && lastSeen > (latestAllowed.get(host) ?? 0))
    .map(({ host }) => host);
  return [...new Set(hosts)];
}
