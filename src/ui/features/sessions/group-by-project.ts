export interface InProject {
  projectPath: string;
}

export interface ProjectGroup<T extends InProject> {
  projectPath: string;
  name: string;
  items: T[];
}

export function projectName(projectPath: string): string {
  return projectPath.split(/[\\/]/).filter(Boolean).pop() ?? projectPath;
}

// Groups keep the order in which each project first appears.
export function groupByProject<T extends InProject>(items: T[]): ProjectGroup<T>[] {
  const groups = new Map<string, ProjectGroup<T>>();
  for (const item of items) {
    const group = groups.get(item.projectPath) ?? { projectPath: item.projectPath, name: projectName(item.projectPath), items: [] };
    group.items.push(item);
    groups.set(item.projectPath, group);
  }
  return [...groups.values()];
}
