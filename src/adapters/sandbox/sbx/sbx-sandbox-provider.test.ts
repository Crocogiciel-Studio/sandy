import { describe, expect, it } from 'vitest';
import { SbxSandboxProvider } from './sbx-sandbox-provider';

describe('SbxSandboxProvider', () => {
  const provider = new SbxSandboxProvider();

  it('offers the 8 built-in sbx agents', () => {
    expect(provider.listAgents()).toEqual([
      'claude',
      'codex',
      'cursor',
      'devin',
      'docker-agent',
      'gemini',
      'opencode',
      'shell',
    ]);
  });

  it('runs sbx run AGENT PATH --name NAME', () => {
    expect(
      provider.sessionCommand({ agent: 'claude', projectPath: '/home/me/Mon Projet', name: 'claude-mon-projet-1a2b3c' }),
    ).toEqual({ command: 'sbx', args: ['run', 'claude', '/home/me/Mon Projet', '--name', 'claude-mon-projet-1a2b3c'] });
  });

  it('copies a file with sbx cp SRC SANDBOX:DST', async () => {
    const calls: string[][] = [];
    const copying = new SbxSandboxProvider(async (args) => void calls.push(args));

    await copying.copyIn({ sandboxName: 'claude-app-1a2b3c', hostPath: '/Users/me/a b.png', sandboxPath: '/tmp/x.png' });

    expect(calls).toEqual([['cp', '/Users/me/a b.png', 'claude-app-1a2b3c:/tmp/x.png']]);
  });
});
