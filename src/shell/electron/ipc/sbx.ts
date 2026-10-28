import { homedir } from 'node:os';
import { ipcMain, shell } from 'electron';
import { SBX_INSTALL_URL, type SbxStatus, type SignInState, type StartSessionResult } from '../../../contracts/api';
import type { SandboxProvider } from '../../../core/ports/sandbox-provider';
import { CommandNotFoundError, type TerminalProvider } from '../../../core/ports/terminal-provider';
import { checkSbx } from '../../../core/use-cases/check-sbx';
import { startSignIn } from '../../../core/use-cases/start-sign-in';
import { isSize } from './terminal';

export function registerSbxIpc(deps: { sandbox: SandboxProvider; terminal: TerminalProvider }): void {
  ipcMain.handle('sbx:check', async (): Promise<SbxStatus> => {
    try {
      return await checkSbx(deps.sandbox);
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('sbx:check-sign-in', (): Promise<SignInState> => deps.sandbox.checkSignIn());

  ipcMain.handle('sbx:sign-in', async (_event, cols: unknown, rows: unknown): Promise<StartSessionResult> => {
    if (!isSize(cols) || !isSize(rows)) return { ok: false, message: 'Requête de connexion invalide.' };
    try {
      return { ok: true, id: await startSignIn(deps, { cwd: homedir(), cols, rows }) };
    } catch (error) {
      if (error instanceof CommandNotFoundError) return { ok: false, message: `${error.command} n'est pas installé.` };
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('sbx:open-install-guide', () => shell.openExternal(SBX_INSTALL_URL));
}
