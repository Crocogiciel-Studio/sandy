import { statSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import type { PrepareDropResult, StartSessionRequest, StartSessionResult } from '../../../contracts/api';
import type { SandboxProvider } from '../../../core/ports/sandbox-provider';
import { CommandNotFoundError, type TerminalProvider } from '../../../core/ports/terminal-provider';
import { sessionName } from '../../../core/domain/session-name';
import { dropFiles } from '../../../core/use-cases/drop-files';
import { startSession } from '../../../core/use-cases/start-session';
import { isSize } from './terminal';

export function registerSessionIpc(deps: { sandbox: SandboxProvider; terminal: TerminalProvider }): void {
  const sessions = new Map<string, { sandboxName: string; projectPath: string }>();
  deps.terminal.onExit((id) => sessions.delete(id));

  ipcMain.handle('session:pick-project', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const options = { properties: ['openDirectory' as const] };
    const result = await (window ? dialog.showOpenDialog(window, options) : dialog.showOpenDialog(options));
    return result.canceled ? undefined : result.filePaths[0];
  });

  ipcMain.handle('session:list-agents', () => [...deps.sandbox.listAgents()]);

  ipcMain.handle('session:start', async (_event, request: StartSessionRequest): Promise<StartSessionResult> => {
    const { agent, projectPath, cols, rows } = request;
    if (!deps.sandbox.listAgents().includes(agent) || !isProjectDirectory(projectPath) || !isSize(cols) || !isSize(rows)) {
      return { ok: false, message: 'Requête de session invalide.' };
    }
    try {
      const id = await startSession(deps, { agent, projectPath, cols, rows });
      sessions.set(id, { sandboxName: sessionName(agent, projectPath), projectPath });
      return { ok: true, id };
    } catch (error) {
      if (error instanceof CommandNotFoundError) return { ok: false, message: `${error.command} n'est pas installé.` };
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('session:prepare-drop', async (_event, id: unknown, hostPaths: unknown): Promise<PrepareDropResult> => {
    const session = typeof id === 'string' ? sessions.get(id) : undefined;
    if (!session || !Array.isArray(hostPaths) || !hostPaths.every(isAbsolutePath)) {
      return { ok: false, message: 'Dépôt invalide.' };
    }
    if (!hostPaths.every(isFile)) return { ok: false, message: 'Seuls les fichiers peuvent être déposés (pas les dossiers).' };
    try {
      return { ok: true, paths: await dropFiles({ sandbox: deps.sandbox, uniqueId: randomUUID }, { ...session, paths: hostPaths }) };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isAbsolutePath(value: unknown): value is string {
  return typeof value === 'string' && isAbsolute(value);
}

// An absolute existing directory also rules out a value that `sbx` would parse as an option.
function isProjectDirectory(value: unknown): value is string {
  if (typeof value !== 'string' || !isAbsolute(value)) return false;
  try {
    return statSync(value).isDirectory();
  } catch {
    return false;
  }
}
