import { BrowserWindow, ipcMain, Notification } from 'electron';

// Shows a notification for a session and, on click, brings the window back and names the session to open.
export function registerNotificationIpc(showWindow: () => void): void {
  ipcMain.on('notification:notify', (_event, id: unknown, title: unknown, body: unknown) => {
    if (typeof id !== 'string' || typeof title !== 'string' || typeof body !== 'string') return;
    if (!Notification.isSupported()) return;
    const notification = new Notification({ title, body });
    notification.on('click', () => {
      showWindow();
      BrowserWindow.getAllWindows().forEach((window) => window.webContents.send('notification:open-session', id));
    });
    notification.show();
  });
}
