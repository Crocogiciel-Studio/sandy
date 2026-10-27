import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSandboxList } from './sbx-list';

// Contract test: the fixture is a trimmed `sbx ls --json` capture (sbx 0.49+).
const fixture = readFileSync(join(import.meta.dirname, '__fixtures__/ls.json'), 'utf8');

describe('parseSandboxList', () => {
  it('reads name, agent, status and workspaces from a real sbx capture', () => {
    const list = parseSandboxList(fixture);

    expect(list).toHaveLength(4);
    expect(list[1]).toEqual({
      name: 'claude-api-b3482f',
      agent: 'claude',
      status: 'running',
      workspaces: ['/Users/me/Dev/api'],
      lastUsedAt: '2026-10-26T12:18:19.095521Z',
    });
    expect(list[3]?.workspaces).toEqual(['/Users/me/Dev/api', '/Users/me/Dev/docs']);
  });

  it('ignores fields it does not know, such as ports', () => {
    expect(parseSandboxList(fixture)[2]).not.toHaveProperty('ports');
  });

  it('drops entries missing the essentials and tolerates a missing workspaces list', () => {
    expect(parseSandboxList('[{"name":"a"},{"name":"b","agent":"claude","status":"stopped"},null]')).toEqual([
      { name: 'b', agent: 'claude', status: 'stopped', workspaces: [] },
    ]);
  });

  it('accepts an empty list and rejects anything but an array', () => {
    expect(parseSandboxList('[]')).toEqual([]);
    expect(() => parseSandboxList('{}')).toThrow('tableau');
    expect(() => parseSandboxList('')).toThrow('illisible');
  });
});
