import { describe, expect, it } from 'vitest';
import type { SandboxSummary } from '../../../contracts/api';
import { buildProjects, projectName, projectState } from './projects';
import type { OpenSession } from './session-state';

const sandbox = (name: string, workspaces: string[]): SandboxSummary => ({ name, agent: 'claude', status: 'running', workspaces });
const session = (projectPath: string, extra: Partial<OpenSession> = {}): OpenSession => ({
  label: 'claude',
  projectPath,
  session: {} as OpenSession['session'],
  ...extra,
});

describe('projectName', () => {
  it('takes the last folder of a POSIX or Windows path', () => {
    expect(projectName('/Users/me/dev/sandy')).toBe('sandy');
    expect(projectName('C:\\dev\\sandy\\')).toBe('sandy');
  });

  it('falls back to the path itself when it has no folder', () => {
    expect(projectName('/')).toBe('/');
  });
});

describe('buildProjects', () => {
  it('makes one project per folder with its sessions and sandboxes', () => {
    const projects = buildProjects([sandbox('claude-api', ['/a/api']), sandbox('claude-web', ['/a/web'])], [session('/a/api'), session('/a/api')]);
    expect(projects.map((project) => [project.name, project.sessions.length, project.sandboxes.map((one) => one.name)])).toEqual([
      ['api', 2, ['claude-api']],
      ['web', 0, ['claude-web']],
    ]);
  });

  it('puts sandboxes without workspace in a last project', () => {
    const projects = buildProjects([sandbox('orphan', []), sandbox('claude-api', ['/a/api'])], []);
    expect(projects.map((project) => project.name)).toEqual(['api', 'Others']);
    expect(projects[1]?.sandboxes.map((one) => one.name)).toEqual(['orphan']);
  });

  it('treats a trailing separator as the same folder and keeps the path as first seen', () => {
    const projects = buildProjects([sandbox('claude-api', ['/a/api/'])], [session('/a/api')]);
    expect(projects).toHaveLength(1);
    expect(projects[0]?.path).toBe('/a/api');
  });

  it('returns no project for nothing', () => {
    expect(buildProjects([], [])).toEqual([]);
  });
});

describe('projectState', () => {
  const project = (...sessions: OpenSession[]) => ({ path: '/a', name: 'a', sessions, sandboxes: [] });

  it('is the most urgent state among the open sessions', () => {
    expect(projectState(project(session('/a', { activity: 'waiting' }), session('/a', { activity: 'attention' }), session('/a', { activity: 'working' })))).toBe('attention');
    expect(projectState(project(session('/a', { activity: 'waiting' }), session('/a', { activity: 'working' })))).toBe('working');
    expect(projectState(project(session('/a')))).toBe('running');
  });

  it('ignores ended sessions and is undefined with none open', () => {
    expect(projectState(project(session('/a', { exitCode: 0 })))).toBeUndefined();
    expect(projectState(project())).toBeUndefined();
  });
});
