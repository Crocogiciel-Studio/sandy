import { describe, expect, it } from 'vitest';
import type { SandboxInfo, SandboxProvider } from '../ports/sandbox-provider';
import type { TerminalOptions, TerminalProvider } from '../ports/terminal-provider';
import { attachSession } from './attach-session';

const existing: SandboxInfo = { name: 'claude-app', agent: 'claude', status: 'stopped', workspaces: ['/work/app'] };

function setup(sandboxes: SandboxInfo[]) {
  const opened: TerminalOptions[] = [];
  const sandbox: SandboxProvider = {
    listAgents: () => [],
    list: async () => sandboxes,
    copyIn: async () => {},
    sessionCommand: () => ({ command: 'sbx', args: [] }),
    attachCommand: (name) => ({ command: 'sbx', args: ['run', '--name', name] }),
  };
  const terminal: TerminalProvider = {
    open: async (options) => (opened.push(options), 'terminal-1'),
    write: () => {},
    resize: () => {},
    close: () => {},
    onData: () => () => {},
    onExit: () => () => {},
  };
  return { deps: { sandbox, terminal }, opened };
}

describe('attachSession', () => {
  it('opens sbx run --name in the sandbox workspace', async () => {
    const { deps, opened } = setup([existing]);

    const result = await attachSession(deps, { name: 'claude-app', cols: 80, rows: 24 });

    expect(result).toEqual({ id: 'terminal-1', sandbox: existing });
    expect(opened).toEqual([{ command: 'sbx', args: ['run', '--name', 'claude-app'], cwd: '/work/app', cols: 80, rows: 24 }]);
  });

  it('rejects an unknown sandbox without opening a terminal', async () => {
    const { deps, opened } = setup([existing]);

    await expect(attachSession(deps, { name: 'nope', cols: 80, rows: 24 })).rejects.toThrow('introuvable');
    expect(opened).toEqual([]);
  });

  it('accepts names outside sandy naming rules, such as underscores', async () => {
    const { deps } = setup([{ ...existing, name: 'my_sandbox' }]);

    await expect(attachSession(deps, { name: 'my_sandbox', cols: 80, rows: 24 })).resolves.toMatchObject({ id: 'terminal-1' });
  });

  it('rejects an invalid name and a sandbox without workspace', async () => {
    const { deps } = setup([{ ...existing, workspaces: [] }]);

    await expect(attachSession(deps, { name: '--help', cols: 80, rows: 24 })).rejects.toThrow('invalide');
    await expect(attachSession(deps, { name: 'claude-app', cols: 80, rows: 24 })).rejects.toThrow('workspace');
  });
});
