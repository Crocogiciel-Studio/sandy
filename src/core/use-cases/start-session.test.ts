import { describe, expect, it } from 'vitest';
import type { SandboxProvider } from '../ports/sandbox-provider';
import { CommandNotFoundError, type TerminalOptions, type TerminalProvider } from '../ports/terminal-provider';
import { startSession } from './start-session';

const sandbox: SandboxProvider = {
  listAgents: () => ['claude'],
  checkInstall: async () => ({ version: '0.49.2' }),
  sessionCommand: ({ agent, projectPath, name }) => ({ command: 'sbx', args: ['run', agent, projectPath, '--name', name] }),
  list: async () => [],
  copyIn: async () => {},
  stop: async () => {},
  remove: async () => {},
  attachCommand: ({ name }) => ({ command: 'sbx', args: ['run', '--name', name] }),
};

function fakeTerminal(open: (options: TerminalOptions) => Promise<string>): TerminalProvider {
  return {
    open,
    write: () => {},
    resize: () => {},
    close: () => {},
    onData: () => () => {},
    onExit: () => () => {},
  };
}

describe('startSession', () => {
  it('opens a terminal on the sandbox session command', async () => {
    const opened: TerminalOptions[] = [];
    const terminal = fakeTerminal(async (options) => {
      opened.push(options);
      return 'term-1';
    });

    const id = await startSession(
      { sandbox, terminal },
      { agent: 'claude', projectPath: '/home/me/Mon Projet', cols: 100, rows: 30 },
    );

    expect(id).toBe('term-1');
    expect(opened).toEqual([
      {
        command: 'sbx',
        args: ['run', 'claude', '/home/me/Mon Projet', '--name', expect.stringMatching(/^claude-mon-projet-[0-9a-f]{6}$/)],
        cwd: '/home/me/Mon Projet',
        cols: 100,
        rows: 30,
      },
    ]);
  });

  it('surfaces a missing sbx command', async () => {
    const terminal = fakeTerminal(async ({ command }) => {
      throw new CommandNotFoundError(command);
    });

    await expect(
      startSession({ sandbox, terminal }, { agent: 'claude', projectPath: '/srv/app', cols: 80, rows: 24 }),
    ).rejects.toEqual(new CommandNotFoundError('sbx'));
  });
});
