// Blocked hosts the user has not decided on: those kept blocked stay out of sight.
export const pendingHosts = (blocked: readonly string[], kept: ReadonlySet<string>): string[] => blocked.filter((host) => !kept.has(host));

// HTTPS is the common case: its port is noise.
export const displayHost = (host: string): string => host.replace(/:443$/, '');
