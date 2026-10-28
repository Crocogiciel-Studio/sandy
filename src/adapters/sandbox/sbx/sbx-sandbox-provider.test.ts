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
      provider.sessionCommand({ agent: 'codex', projectPath: '/home/me/Mon Projet', name: 'codex-mon-projet-1a2b3c' }),
    ).toEqual({ command: 'sbx', args: ['run', 'codex', '/home/me/Mon Projet', '--name', 'codex-mon-projet-1a2b3c'] });
  });

  it('hands Claude its state-reporting hooks after --', () => {
    const { args } = provider.sessionCommand({ agent: 'claude', projectPath: '/p', name: 'claude-p-1a2b3c' });
    expect(args.slice(0, 6)).toEqual(['run', 'claude', '/p', '--name', 'claude-p-1a2b3c', '--']);
    expect(args[6]).toBe('--settings');
    expect(Object.keys(JSON.parse(args[7]!).hooks)).toEqual(['UserPromptSubmit', 'PostToolUse', 'Notification', 'Stop']);
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
    expect(provider.attachCommand({ name: 'codex-app', agent: 'codex' })).toEqual({ command: 'sbx', args: ['run', '--name', 'codex-app'] });
    expect(provider.attachCommand({ name: 'claude-app', agent: 'claude' }).args.slice(0, 4)).toEqual(['run', '--name', 'claude-app', '--']);
  });

  it('stops with sbx stop NAME and removes with sbx rm -f NAME', async () => {
    const calls: string[][] = [];
    const managing = new SbxSandboxProvider(async (args) => (calls.push(args), ''));

    await managing.stop('claude-app');
    await managing.remove('claude-app');

    expect(calls).toEqual([['stop', 'claude-app'], ['rm', '-f', 'claude-app']]);
  });

  describe('checkInstall', () => {
    const failing = (code: string | undefined) =>
      new SbxSandboxProvider(async () => {
        throw Object.assign(new Error('sbx version a échoué : boom'), { code });
      });

    it('reads the version from sbx version --json', async () => {
      const calls: string[][] = [];
      const checking = new SbxSandboxProvider(async (args) => (calls.push(args), '{"client":{"version":"v0.49.2"}}'));

      expect(await checking.checkInstall()).toEqual({ version: '0.49.2' });
      expect(calls).toEqual([['version', '--json']]);
    });

    it('is undefined when sbx is not installed', async () => {
      expect(await failing('ENOENT').checkInstall()).toBeUndefined();
    });

    it('is undefined when the output has no version', async () => {
      expect(await new SbxSandboxProvider(async () => '{}').checkInstall()).toBeUndefined();
    });

    it('rejects when sbx is there but fails', async () => {
      await expect(failing(undefined).checkInstall()).rejects.toThrow('boom');
    });
  });
});
