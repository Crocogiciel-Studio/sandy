import { join } from 'node:path';
import { app, BrowserWindow } from 'electron';
import { SbxSandboxProvider } from '../../adapters/sandbox/sbx/sbx-sandbox-provider';
import { NodePtyTerminal } from '../../adapters/terminal/node-pty/node-pty-terminal';
import { registerSbxIpc } from './ipc/sbx';
import { registerSessionIpc } from './ipc/session';
import { registerTerminalIpc } from './ipc/terminal';

function createWindow(terminal: NodePtyTerminal): void {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'sandy',
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // Without a window nothing can reach the sessions, so stop the agents instead of orphaning them.
  window.on('closed', () => terminal.closeAll());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());

  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }
}

void app.whenReady().then(() => {
  const terminal = new NodePtyTerminal(join(import.meta.dirname, 'pty-host.js'));
  registerTerminalIpc(terminal);
  const sandbox = new SbxSandboxProvider();
  registerSbxIpc({ sandbox, terminal });
  registerSessionIpc({ sandbox, terminal });
  createWindow(terminal);

  app.on('before-quit', () => terminal.dispose());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(terminal);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
