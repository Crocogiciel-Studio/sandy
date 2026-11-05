import { join } from 'node:path';
import { app, Menu, nativeImage, Tray } from 'electron';

// Windows and Linux have no Dock: once the window is hidden, the tray is the way back.
export function createTray(show: () => void): Tray {
  const file = app.isPackaged ? join(process.resourcesPath, 'icon.png') : join(app.getAppPath(), 'build/icon.png');
  const tray = new Tray(nativeImage.createFromPath(file).resize({ width: 16, height: 16 }));
  tray.setToolTip('Sandy');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Sandy', click: show },
      { label: 'Quit', click: () => app.quit() },
    ]),
  );
  tray.on('click', show);
  return tray;
}
