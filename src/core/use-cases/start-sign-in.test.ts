import { describe, expect, it } from 'vitest';
import type { TerminalOptions, TerminalProvider } from '../ports/terminal-provider';
import { startSignIn } from './start-sign-in';

describe('startSignIn', () => {
  it('opens a terminal on the sign-in command in the given folder', async () => {
    const opened: TerminalOptions[] = [];
    const terminal = { open: async (options: TerminalOptions) => (opened.push(options), 'term-1') } as unknown as TerminalProvider;
    const sandbox = { signInCommand: () => ({ command: 'sbx', args: ['login'] }) } as never;

    const id = await startSignIn({ sandbox, terminal }, { cwd: '/home/me', cols: 80, rows: 24 });

    expect(id).toBe('term-1');
    expect(opened).toEqual([{ command: 'sbx', args: ['login'], cwd: '/home/me', cols: 80, rows: 24 }]);
  });
});
