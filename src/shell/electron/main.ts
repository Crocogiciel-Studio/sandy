import { join } from 'node:path';
import { app, BrowserWindow, dialog } from 'electron';
import { SbxSandboxProvider } from '../../adapters/sandbox/sbx/sbx-sandbox-provider';
import { NodePtyTerminal } from '../../adapters/terminal/node-pty/node-pty-terminal';
import { registerNotificationIpc } from './ipc/notification';
import { registerSbxIpc } from './ipc/sbx';
import { registerSessionIpc } from './ipc/session';
import { registerTerminalIpc } from './ipc/terminal';
import { hostPaths } from '../../pty-host/paths';
import { quitChoice, quitPrompt, type QuitChoice } from './quit-guard';
import { createTray } from './tray';


// Set once quitting is decided: until then closing the window only hides it.
let quitting = false;

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Sandy',
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // The window is hidden, not destroyed: its terminals and session list live in the renderer,
  // so showing it again restores every session. Quitting is the way to stop them.
  window.on('close', (event) => {
    if (quitting) return;
    event.preventDefault();
    // Hiding a fullscreen window leaves an empty Space behind on macOS: leave fullscreen first.
    if (window.isFullScreen()) {
      window.once('leave-full-screen', () => window.hide());
      window.setFullScreen(false);
    } else {
      window.hide();
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());

  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }
}

function showWindow(): void {
  const [window] = BrowserWindow.getAllWindows();
  if (window) window.show();
  else createWindow();
}

app.setName('Sandy');

// A second instance would start its own pty-host, blind to the sessions of the one hidden in the tray.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  void app.whenReady().then(start);
}

async function start(): Promise<void> {
  // Packaged builds get their icon from electron-builder; in dev the dock would show Electron's.
  if (!app.isPackaged) app.dock?.setIcon(join(app.getAppPath(), 'build/icon.png'));
  const terminal = new NodePtyTerminal(join(import.meta.dirname, 'pty-host.js'), hostPaths(app.getPath('userData')));
  // A host from an earlier launch keeps its sessions: reconnect to it first, so the quit dialog counts them.
  const host = await terminal.inspectHost();
  if (host === 'foreign' && !(await replaceForeignHost(terminal))) return app.quit();
  if (host === 'compatible') await terminal.list();
  registerTerminalIpc(terminal);
  const sandbox = new SbxSandboxProvider();
  registerSbxIpc({ sandbox, terminal });
  registerSessionIpc({ sandbox, terminal });
  registerNotificationIpc(showWindow);
  createWindow();
  if (process.platform !== 'darwin') createTray(showWindow);

  app.on('before-quit', (event) => {
    if (quitting) return;
    const prompt = quitPrompt(terminal.runningCount());
    let choice: QuitChoice = 'stop';
    if (prompt) {
      event.preventDefault();
      choice = quitChoice(dialog.showMessageBoxSync({ type: 'warning', ...prompt }));
      if (choice === 'cancel') return;
    }
    quitting = true;
    // Stopping also ends the host, which would otherwise outlive the app with nothing to serve.
    if (choice === 'keep') terminal.disconnect();
    else terminal.dispose();
    if (prompt) app.quit();
  });

  app.on('activate', showWindow);
}

// An update can leave the previous version's host running, with sessions this version cannot drive.
async function replaceForeignHost(terminal: NodePtyTerminal): Promise<boolean> {
  const { response } = await dialog.showMessageBox({
    type: 'warning',
    message: 'Sessions from a previous version of Sandy are still running',
    detail: 'This version cannot reconnect to them. Stop them to continue, or quit and finish their work with the previous version.',
    buttons: ['Stop them and continue', 'Quit'],
    defaultId: 1,
    cancelId: 1,
  });
  if (response !== 0) return false;
  await terminal.stopForeignHost();
  return true;
}
