const SEPARATORS = /[\\/]+/;

// Whether a host file already lives in the workspace, which the sandbox mounts at the same path.
// Compares separator-normalised, case-sensitive paths.
export function isInsideProject(projectPath: string, filePath: string): boolean {
  const project = segments(projectPath);
  const file = segments(filePath);
  return file.length > project.length && project.every((part, index) => part === file[index]);
}

// Flat file in the sandbox temp dir: no directory has to exist, the id keeps same-named drops apart.
export function sandboxDropPath(uniqueId: string, filePath: string): string {
  const name = (segments(filePath).pop() ?? 'file').replace(/[^\w.-]+/g, '_');
  return `/tmp/sandy-drop-${uniqueId}-${name}`;
}

function segments(path: string): string[] {
  return path.split(SEPARATORS).filter(Boolean);
}
