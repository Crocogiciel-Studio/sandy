/// <reference types="vite/client" />
import type { SandyApi } from '../contracts/api';

declare global {
  interface Window {
    sandy: SandyApi;
  }
}
