import type { SbxStatus } from '../../../contracts/api';

// Why sbx cannot be used, in the user's words. Undefined once it can.
export function sbxProblem(status: SbxStatus): string | undefined {
  switch (status.status) {
    case 'ok':
      return undefined;
    case 'missing':
      return 'sbx was not found on this machine.';
    case 'outdated':
      return `sbx ${status.version} is too old (minimum ${status.minimum}).`;
    case 'error':
      return `sbx is installed but not responding: ${status.message}`;
  }
}
