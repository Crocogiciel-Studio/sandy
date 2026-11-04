import { describe, expect, it } from 'vitest';
import type { PolicyLog } from '../domain/blocked-domain';
import type { SandboxProvider } from '../ports/sandbox-provider';
import { allowBlockedHost, listBlockedHosts } from './blocked-hosts';

function setup(log: PolicyLog = { allowed: [], blocked: [{ host: 'crocogiciel.com:443', lastSeen: 200 }] }) {
  const allowed: string[] = [];
  const sandbox: SandboxProvider = {
    listAgents: () => [],
    checkInstall: async () => ({ version: '0.51.0' }),
    checkSignIn: async () => 'signed-in' as const,
    signInCommand: () => ({ command: 'sbx', args: ['login'] }),
    list: async () => [{ name: 'claude-app', agent: 'claude', status: 'running', workspaces: ['/work/app'] }],
    copyIn: async () => {},
    sessionCommand: () => ({ command: 'sbx', args: [] }),
    attachCommand: () => ({ command: 'sbx', args: [] }),
    stop: async () => {},
    remove: async () => {},
    policyLog: async () => log,
    allowHost: async ({ name, host }) => void allowed.push(`${name} ${host}`),
  };
  return { sandbox, allowed };
}

describe('listBlockedHosts', () => {
  it('returns the hosts blocked since the session opened', async () => {
    expect(await listBlockedHosts(setup().sandbox, 'claude-app', 100)).toEqual(['crocogiciel.com:443']);
    expect(await listBlockedHosts(setup().sandbox, 'claude-app', 300)).toEqual([]);
  });

  it('refuses unknown and option-like sandboxes', async () => {
    await expect(listBlockedHosts(setup().sandbox, 'nope', 0)).rejects.toThrow('not found');
    await expect(listBlockedHosts(setup().sandbox, '--all', 0)).rejects.toThrow('Invalid');
  });
});

describe('allowBlockedHost', () => {
  it('allows a blocked host for its sandbox', async () => {
    const { sandbox, allowed } = setup();

    await allowBlockedHost(sandbox, { name: 'claude-app', host: 'crocogiciel.com:443', since: 100 });

    expect(allowed).toEqual(['claude-app crocogiciel.com:443']);
  });

  it('refuses a host that is not blocked, a wildcard, or an option', async () => {
    const { sandbox, allowed } = setup();

    for (const host of ['other.com:443', '*', '**.com', '--sandbox']) {
      await expect(allowBlockedHost(sandbox, { name: 'claude-app', host, since: 100 })).rejects.toThrow();
    }
    expect(allowed).toEqual([]);
  });

  it('refuses a host already allowed since its last block', async () => {
    const { sandbox, allowed } = setup({
      allowed: [{ host: 'crocogiciel.com:443', lastSeen: 300 }],
      blocked: [{ host: 'crocogiciel.com:443', lastSeen: 200 }],
    });

    await expect(allowBlockedHost(sandbox, { name: 'claude-app', host: 'crocogiciel.com:443', since: 100 })).rejects.toThrow('not blocked');
    expect(allowed).toEqual([]);
  });
});
