import type { SandboxSummary } from '../../../contracts/api';
import { sessionState, type OpenSession, type SessionState } from './session-state';

export interface Project {
  // Empty for sandboxes that report no workspace.
  path: string;
  name: string;
  sessions: OpenSession[];
  sandboxes: SandboxSummary[];
}

export const OTHER_PROJECT_NAME = 'Others';

export function projectName(projectPath: string): string {
  return projectPath.split(/[\\/]/).filter(Boolean).pop() ?? projectPath;
}

// A trailing separator must not split one folder into two projects.
const projectKey = (path: string): string => (/^[\\/]+$/.test(path) ? path : path.replace(/[\\/]+$/, ''));

// One project per folder, in order of first appearance (sessions first); sandboxes without workspace come last.
export function buildProjects(sandboxes: SandboxSummary[], sessions: OpenSession[]): Project[] {
  const projects = new Map<string, Project>();
  const projectOf = (path: string): Project => {
    const key = projectKey(path);
    let project = projects.get(key);
    if (!project) {
      project = { path, name: path ? projectName(key) : OTHER_PROJECT_NAME, sessions: [], sandboxes: [] };
      projects.set(key, project);
    }
    return project;
  };
  for (const session of sessions) projectOf(session.projectPath).sessions.push(session);
  for (const sandbox of sandboxes) projectOf(sandbox.workspaces[0] ?? '').sandboxes.push(sandbox);
  const all = [...projects.values()];
  return [...all.filter((project) => project.path), ...all.filter((project) => !project.path)];
}

const URGENCY: SessionState[] = ['attention', 'working', 'waiting', 'running'];

// The most urgent state among the project's open sessions; undefined when none is open.
export function projectState(project: Project): SessionState | undefined {
  const states = project.sessions.map(sessionState);
  return URGENCY.find((state) => states.includes(state));
}

// Id of a project's page among the main area's views; session ids are UUIDs, so they never collide.
export const projectViewId = (path: string): string => `project:${projectKey(path)}`;
