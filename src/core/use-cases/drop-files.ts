import { isInsideProject, sandboxDropPath } from '../domain/dropped-file';
import type { SandboxProvider } from '../ports/sandbox-provider';

export interface DropFiles {
  sandboxName: string;
  projectPath: string;
  paths: readonly string[];
}

// Resolves with the paths the agent can open: project files as is (same path in the sandbox),
// others copied into the sandbox. Rejects if any copy fails, so nothing partial gets typed.
export async function dropFiles(
  deps: { sandbox: SandboxProvider; uniqueId: () => string },
  { sandboxName, projectPath, paths }: DropFiles,
): Promise<string[]> {
  return Promise.all(
    paths.map(async (hostPath) => {
      if (isInsideProject(projectPath, hostPath)) return hostPath;
      const sandboxPath = sandboxDropPath(deps.uniqueId(), hostPath);
      await deps.sandbox.copyIn({ sandboxName, hostPath, sandboxPath });
      return sandboxPath;
    }),
  );
}
