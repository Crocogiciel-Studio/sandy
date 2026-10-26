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
});
