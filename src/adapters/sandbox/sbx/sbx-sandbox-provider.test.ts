import { describe, expect, it } from 'vitest';
import { SbxSandboxProvider } from './sbx-sandbox-provider';

describe('SbxSandboxProvider', () => {
  const provider = new SbxSandboxProvider();

  it('offers the 11 built-in sbx agents', () => {
    expect(provider.listAgents()).toEqual([
      'claude',
      'codex',
      'copilot',
      'cursor',
      'devin',
      'docker-agent',
      'droid',
      'gemini',
      'kiro',
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
    const copying = new SbxSandboxProvider(async (args) => (calls.push(args), ''));

    await copying.copyIn({ sandboxName: 'claude-app-1a2b3c', hostPath: '/Users/me/a b.png', sandboxPath: '/tmp/x.png' });

    expect(calls).toEqual([['cp', '/Users/me/a b.png', 'claude-app-1a2b3c:/tmp/x.png']]);
  });

  it('lists sandboxes from sbx ls --json', async () => {
    const calls: string[][] = [];
    const listing = new SbxSandboxProvider(async (args) => (calls.push(args), '[{"name":"a","agent":"claude","status":"running"}]'));

    expect(await listing.list()).toEqual([{ name: 'a', agent: 'claude', status: 'running', workspaces: [] }]);
    expect(calls).toEqual([['ls', '--json']]);
  });

  it('re-attaches with sbx run --name NAME', () => {
    expect(provider.attachCommand('claude-app')).toEqual({ command: 'sbx', args: ['run', '--name', 'claude-app'] });
  });

  it('stops with sbx stop NAME and removes with sbx rm -f NAME', async () => {
    const calls: string[][] = [];
    const managing = new SbxSandboxProvider(async (args) => (calls.push(args), ''));

    await managing.stop('claude-app');
    await managing.remove('claude-app');

    expect(calls).toEqual([['stop', 'claude-app'], ['rm', '-f', 'claude-app']]);
  });
});
