import { BrowserWindow, ipcMain } from 'electron';
import type { TerminalProvider } from '../../../core/ports/terminal-provider';

export function registerTerminalIpc(terminal: TerminalProvider): void {
  const broadcast = (channel: string, ...args: unknown[]): void =>
    BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(channel, ...args));

  terminal.onData((id, data) => broadcast('terminal:data', id, data));
  terminal.onExit((id, exitCode) => broadcast('terminal:exit', id, exitCode));

  ipcMain.on('terminal:write', (_event, id: unknown, data: unknown) => {
    if (typeof id === 'string' && typeof data === 'string') terminal.write(id, data);
  });
  ipcMain.on('terminal:resize', (_event, id: unknown, cols: unknown, rows: unknown) => {
    if (typeof id === 'string' && isSize(cols) && isSize(rows)) terminal.resize(id, cols, rows);
  });
  ipcMain.on('terminal:close', (_event, id: unknown) => {
    if (typeof id === 'string') terminal.close(id);
  });
}

export function isSize(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0 && (value as number) <= 1000;
}
