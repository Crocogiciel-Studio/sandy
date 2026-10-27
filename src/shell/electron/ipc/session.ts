import { statSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import type { StartSessionRequest, StartSessionResult } from '../../../contracts/api';
import type { SandboxProvider } from '../../../core/ports/sandbox-provider';
import { CommandNotFoundError, type TerminalProvider } from '../../../core/ports/terminal-provider';
import { startSession } from '../../../core/use-cases/start-session';
import { isSize } from './terminal';

export function registerSessionIpc(deps: { sandbox: SandboxProvider; terminal: TerminalProvider }): void {
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
      return { ok: true, id: await startSession(deps, { agent, projectPath, cols, rows }) };
    } catch (error) {
      if (error instanceof CommandNotFoundError) return { ok: false, message: `${error.command} n'est pas installé.` };
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });
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
