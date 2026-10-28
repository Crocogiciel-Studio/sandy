import { ipcMain, shell } from 'electron';
import { SBX_RELEASES_URL, type SbxStatus } from '../../../contracts/api';
import type { SandboxProvider } from '../../../core/ports/sandbox-provider';
import { checkSbx } from '../../../core/use-cases/check-sbx';

export function registerSbxIpc(deps: { sandbox: SandboxProvider }): void {
  ipcMain.handle('sbx:check', async (): Promise<SbxStatus> => {
    try {
      return await checkSbx(deps.sandbox);
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('sbx:open-releases', () => shell.openExternal(SBX_RELEASES_URL));
}
