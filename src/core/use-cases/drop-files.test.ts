import { describe, expect, it } from 'vitest';
import type { SandboxProvider } from '../ports/sandbox-provider';
import { dropFiles } from './drop-files';

function fakeSandbox(fail = false) {
  const copies: Array<{ sandboxName: string; hostPath: string; sandboxPath: string }> = [];
  const sandbox: SandboxProvider = {
    listAgents: () => [],
    list: async () => [],
    stop: async () => {},
    remove: async () => {},
    attachCommand: () => ({ command: 'sbx', args: [] }),
    sessionCommand: () => ({ command: 'sbx', args: [] }),
    copyIn: async (request) => {
      if (fail) throw new Error('copy failed');
      copies.push(request);
    },
  };
  let count = 0;
  return { copies, deps: { sandbox, uniqueId: () => `id${++count}` } };
}

describe('dropFiles', () => {
  it('passes project files through without copying', async () => {
    const { deps, copies } = fakeSandbox();

    const paths = await dropFiles(deps, { sandboxName: 's', projectPath: '/work/app', paths: ['/work/app/a.ts'] });

    expect(paths).toEqual(['/work/app/a.ts']);
    expect(copies).toEqual([]);
  });

  it('copies outside files into the sandbox and returns the sandbox path', async () => {
    const { deps, copies } = fakeSandbox();

    const paths = await dropFiles(deps, {
      sandboxName: 's',
      projectPath: '/work/app',
      paths: ['/work/app/a.ts', '/Users/me/Downloads/b.png', '/Users/me/Downloads/c.png'],
    });

    expect(paths).toEqual(['/work/app/a.ts', '/tmp/sandy-drop-id1-b.png', '/tmp/sandy-drop-id2-c.png']);
    expect(copies[0]).toEqual({
      sandboxName: 's',
      hostPath: '/Users/me/Downloads/b.png',
      sandboxPath: '/tmp/sandy-drop-id1-b.png',
    });
  });

  it('rejects when a copy fails', async () => {
    const { deps } = fakeSandbox(true);

    await expect(
      dropFiles(deps, { sandboxName: 's', projectPath: '/work/app', paths: ['/elsewhere/a.png'] }),
    ).rejects.toThrow('copy failed');
  });
});
