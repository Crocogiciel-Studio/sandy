import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron';
import type { SandyApi } from '../../../contracts/api';

function subscribe<T extends unknown[]>(channel: string, listener: (...args: T) => void): () => void {
  const handler = (_event: IpcRendererEvent, ...args: unknown[]): void => listener(...(args as T));
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.off(channel, handler);
}

const api: SandyApi = {
  terminal: {
    write: (id, data) => ipcRenderer.send('terminal:write', id, data),
    resize: (id, cols, rows) => ipcRenderer.send('terminal:resize', id, cols, rows),
    close: (id) => ipcRenderer.send('terminal:close', id),
    onData: (listener) => subscribe('terminal:data', listener),
    onExit: (listener) => subscribe('terminal:exit', listener),
  },
  session: {
    pickProject: () => ipcRenderer.invoke('session:pick-project'),
    listAgents: () => ipcRenderer.invoke('session:list-agents'),
    start: (request) => ipcRenderer.invoke('session:start', request),
    prepareDrop: (id, hostPaths) => ipcRenderer.invoke('session:prepare-drop', id, hostPaths),
    pasteImage: (id, image, mimeType) => ipcRenderer.invoke('session:paste-image', id, image, mimeType),
  },
  files: {
    pathsFor: (files) => files.map((file) => webUtils.getPathForFile(file)).filter((path) => path !== ''),
  },
};

contextBridge.exposeInMainWorld('sandy', api);
