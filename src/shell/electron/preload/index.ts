import { contextBridge } from 'electron';
import type { SandyApi } from '../../../contracts/api';

const api: SandyApi = {};

contextBridge.exposeInMainWorld('sandy', api);
