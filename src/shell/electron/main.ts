import { join } from 'node:path';
import { app, BrowserWindow, dialog } from 'electron';
import { SbxSandboxProvider } from '../../adapters/sandbox/sbx/sbx-sandbox-provider';
import { NodePtyTerminal } from '../../adapters/terminal/node-pty/node-pty-terminal';
import { registerSbxIpc } from './ipc/sbx';
import { registerSessionIpc } from './ipc/session';
import { registerTerminalIpc } from './ipc/terminal';
import { hostPaths } from '../../pty-host/paths';
import { quitPrompt } from './quit-guard';
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

function start(): void {
  // Packaged builds get their icon from electron-builder; in dev the dock would show Electron's.
  if (!app.isPackaged) app.dock?.setIcon(join(app.getAppPath(), 'build/icon.png'));
  const terminal = new NodePtyTerminal(join(import.meta.dirname, 'pty-host.js'), hostPaths(app.getPath('userData')));
  registerTerminalIpc(terminal);
  const sandbox = new SbxSandboxProvider();
  registerSbxIpc({ sandbox, terminal });
  registerSessionIpc({ sandbox, terminal });
  createWindow();
  if (process.platform !== 'darwin') createTray(showWindow);

  app.on('before-quit', (event) => {
    if (quitting) return terminal.dispose();
    const prompt = quitPrompt(terminal.runningCount());
    if (prompt) {
      event.preventDefault();
      const choice = dialog.showMessageBoxSync({ type: 'warning', buttons: ['Cancel', 'Quit'], defaultId: 0, cancelId: 0, ...prompt });
      if (choice !== 1) return;
    }
    quitting = true;
    if (prompt) return app.quit();
    terminal.dispose();
  });

  app.on('activate', showWindow);
}
