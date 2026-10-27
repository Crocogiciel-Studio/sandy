import { describe, expect, it } from 'vitest';
import { groupByProject, projectName } from './group-by-project';

describe('projectName', () => {
  it('takes the last folder of a POSIX or Windows path', () => {
    expect(projectName('/Users/me/dev/sandy')).toBe('sandy');
    expect(projectName('C:\\dev\\sandy\\')).toBe('sandy');
  });

  it('falls back to the path itself when it has no folder', () => {
    expect(projectName('/')).toBe('/');
  });
});

describe('groupByProject', () => {
  it('groups items by project, in order of first appearance', () => {
    const groups = groupByProject([
      { projectPath: '/a/api', id: 1 },
      { projectPath: '/a/web', id: 2 },
      { projectPath: '/a/api', id: 3 },
    ]);
    expect(groups.map((group) => [group.name, group.items.map((item) => item.id)])).toEqual([
      ['api', [1, 3]],
      ['web', [2]],
    ]);
  });

  it('returns no group for no item', () => {
    expect(groupByProject([])).toEqual([]);
  });
});
