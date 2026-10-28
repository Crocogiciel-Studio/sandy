import { describe, expect, it } from 'vitest';
import type { SandboxProvider } from '../ports/sandbox-provider';
import { removeSandbox, stopSandbox } from './manage-sandbox';

function setup() {
  const calls: string[] = [];
  const sandbox: SandboxProvider = {
    listAgents: () => [],
    checkInstall: async () => ({ version: '0.49.2' }),
    checkSignIn: async () => 'signed-in' as const,
    signInCommand: () => ({ command: 'sbx', args: ['login'] }),
    list: async () => [{ name: 'claude-app', agent: 'claude', status: 'running', workspaces: ['/work/app'] }],
    copyIn: async () => {},
    sessionCommand: () => ({ command: 'sbx', args: [] }),
    attachCommand: () => ({ command: 'sbx', args: [] }),
    stop: async (name) => void calls.push(`stop ${name}`),
    remove: async (name) => void calls.push(`rm ${name}`),
  };
  return { sandbox, calls };
}

describe('manage sandbox', () => {
  it('stops and removes a sandbox that sbx lists', async () => {
    const { sandbox, calls } = setup();

    await stopSandbox(sandbox, 'claude-app');
    await removeSandbox(sandbox, 'claude-app');

    expect(calls).toEqual(['stop claude-app', 'rm claude-app']);
  });

  it('refuses unknown and option-like names without touching sbx', async () => {
    const { sandbox, calls } = setup();

    await expect(stopSandbox(sandbox, 'nope')).rejects.toThrow('introuvable');
    await expect(removeSandbox(sandbox, '--all')).rejects.toThrow('invalide');
    expect(calls).toEqual([]);
  });
});
