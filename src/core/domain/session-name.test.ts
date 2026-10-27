import { describe, expect, it } from 'vitest';
import { isValidSandboxName } from './sandbox-name';
import { sessionName } from './session-name';

describe('sessionName', () => {
  it('derives <agent>-<folder>-<hash>', () => {
    expect(sessionName('claude', '/home/me/Mon Projet')).toMatch(/^claude-mon-projet-[0-9a-f]{6}$/);
  });

  it('is stable for the same folder', () => {
    expect(sessionName('claude', '/home/me/app')).toBe(sessionName('claude', '/home/me/app'));
  });

  it('separates same-named folders at different paths', () => {
    expect(sessionName('claude', '/home/me/a/app')).not.toBe(sessionName('claude', '/home/me/b/app'));
  });

  it.each([
    ['/home/me/Mon Projet', /^claude-mon-projet-/],
    ['/home/me/Été à Paris', /^claude-ete-a-paris-/],
    ['/home/me/my_app (copy) #2!', /^claude-my-app-copy-2-/],
    ['C:\\Users\\me\\Démo', /^claude-demo-/],
    ['/home/me/.hidden', /^claude-hidden-/],
    ['/home/me/项目', /^claude-[0-9a-f]{6}$/],
    ['/', /^claude-[0-9a-f]{6}$/],
    [`/home/me/${'x'.repeat(200)}`, /^claude-x{40}-[0-9a-f]{6}$/],
  ])('cleans %j into a valid sandbox name', (path, expected) => {
    const name = sessionName('claude', path);
    expect(name).toMatch(expected);
    expect(isValidSandboxName(name)).toBe(true);
  });

  it('keeps agent names with dashes', () => {
    expect(sessionName('docker-agent', '/srv/app')).toMatch(/^docker-agent-app-[0-9a-f]{6}$/);
  });
});
