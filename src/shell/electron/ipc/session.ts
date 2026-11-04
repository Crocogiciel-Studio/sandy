import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import type {
  ActionResult,
  AttachSessionRequest,
  BlockedHostsResult,
  ListSandboxesResult,
  PrepareDropResult,
  StartSessionRequest,
  StartSessionResult,
} from '../../../contracts/api';
import type { SandboxProvider } from '../../../core/ports/sandbox-provider';
import { CommandNotFoundError, type TerminalProvider } from '../../../core/ports/terminal-provider';
import { sandboxDropPath } from '../../../core/domain/dropped-file';
import { sessionName } from '../../../core/domain/session-name';
import { allowBlockedHost, listBlockedHosts } from '../../../core/use-cases/blocked-hosts';
import { attachSession } from '../../../core/use-cases/attach-session';
import { dropFiles } from '../../../core/use-cases/drop-files';
import { removeSandbox, stopSandbox } from '../../../core/use-cases/manage-sandbox';
import { startSession } from '../../../core/use-cases/start-session';
import { isSize } from './terminal';

const IMAGE_EXTENSIONS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export function registerSessionIpc(deps: { sandbox: SandboxProvider; terminal: TerminalProvider }): void {
  const sessions = new Map<string, { sandboxName: string; projectPath: string; startedAt: number; allowedHosts: Set<string> }>();
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
      return { ok: false, message: 'Invalid session request.' };
    }
    try {
      // Every launch is a new sandbox: re-attaching an existing one is "new session" on its row.
      const suffix = randomUUID().slice(0, 6);
      const id = await startSession(deps, { agent, projectPath, cols, rows, suffix });
      sessions.set(id, { sandboxName: sessionName(agent, projectPath, suffix), projectPath, startedAt: Date.now(), allowedHosts: new Set() });
      return { ok: true, id };
    } catch (error) {
      if (error instanceof CommandNotFoundError) return { ok: false, message: `${error.command} is not installed.` };
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('session:list-sandboxes', async (): Promise<ListSandboxesResult> => {
    try {
      return { ok: true, sandboxes: await deps.sandbox.list() };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });

  // sbx acts first: if it fails nothing is lost. On success, sessions it did not already end are closed,
  // so their tabs report the exit instead of a dead PTY (closing an already-ended terminal is a no-op).
  const manage = (act: (sandbox: SandboxProvider, name: string) => Promise<void>) =>
    async (_event: unknown, name: unknown): Promise<ActionResult> => {
      if (typeof name !== 'string') return { ok: false, message: 'Invalid request.' };
      try {
        await act(deps.sandbox, name);
        for (const [id, session] of sessions) if (session.sandboxName === name) deps.terminal.close(id);
        return { ok: true };
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : String(error) };
      }
    };
  ipcMain.handle('session:stop-sandbox', manage(stopSandbox));
  ipcMain.handle('session:remove-sandbox', manage(removeSandbox));

  ipcMain.handle('session:attach', async (_event, request: AttachSessionRequest): Promise<StartSessionResult> => {
    const { name, cols, rows } = request;
    if (typeof name !== 'string' || !isSize(cols) || !isSize(rows)) return { ok: false, message: 'Invalid session request.' };
    try {
      const { id, sandbox } = await attachSession(deps, { name, cols, rows });
      sessions.set(id, { sandboxName: sandbox.name, projectPath: sandbox.workspaces[0] ?? '', startedAt: Date.now(), allowedHosts: new Set() });
      return { ok: true, id };
    } catch (error) {
      if (error instanceof CommandNotFoundError) return { ok: false, message: `${error.command} is not installed.` };
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });

  // The sandbox comes from the session, never from the renderer; only hosts sbx blocks right now can be allowed.
  ipcMain.handle('session:blocked-hosts', async (_event, id: unknown): Promise<BlockedHostsResult> => {
    const session = typeof id === 'string' ? sessions.get(id) : undefined;
    if (!session) return { ok: false, message: 'Invalid request.' };
    try {
      return { ok: true, hosts: await listBlockedHosts(deps.sandbox, session.sandboxName, session.startedAt, session.allowedHosts) };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('session:allow-host', async (_event, id: unknown, host: unknown): Promise<ActionResult> => {
    const session = typeof id === 'string' ? sessions.get(id) : undefined;
    if (!session || typeof host !== 'string') return { ok: false, message: 'Invalid request.' };
    try {
      await allowBlockedHost(deps.sandbox, { name: session.sandboxName, host, since: session.startedAt, allowed: session.allowedHosts });
      session.allowedHosts.add(host);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('session:prepare-drop', async (_event, id: unknown, hostPaths: unknown): Promise<PrepareDropResult> => {
    const session = typeof id === 'string' ? sessions.get(id) : undefined;
    if (!session || !Array.isArray(hostPaths) || !hostPaths.every(isAbsolutePath)) {
      return { ok: false, message: 'Invalid drop.' };
    }
    if (!hostPaths.every(isFile)) return { ok: false, message: 'Only files can be dropped, not folders.' };
    try {
      return { ok: true, paths: await dropFiles({ sandbox: deps.sandbox, uniqueId: randomUUID }, { ...session, paths: hostPaths }) };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('session:paste-image', async (_event, id: unknown, image: unknown, mimeType: unknown): Promise<PrepareDropResult> => {
    const session = typeof id === 'string' ? sessions.get(id) : undefined;
    const extension = typeof mimeType === 'string' ? IMAGE_EXTENSIONS[mimeType] : undefined;
    if (!session || !extension || !(image instanceof ArrayBuffer) || image.byteLength === 0) {
      return { ok: false, message: 'Invalid image.' };
    }
    if (image.byteLength > MAX_IMAGE_BYTES) return { ok: false, message: 'Image too large (20 MB maximum).' };
    // sbx cp needs a file: stage the image in a private temp dir, copy it, then remove it.
    const dir = mkdtempSync(join(tmpdir(), 'sandy-paste-'));
    try {
      const file = join(dir, `screenshot.${extension}`);
      writeFileSync(file, Buffer.from(image));
      // Always copied, even if the project contains the temp dir: the staged file is deleted below.
      const sandboxPath = sandboxDropPath(randomUUID(), file);
      await deps.sandbox.copyIn({ sandboxName: session.sandboxName, hostPath: file, sandboxPath });
      return { ok: true, paths: [sandboxPath] };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    } finally {
      rmSync(dir, { recursive: true, force: true });
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
