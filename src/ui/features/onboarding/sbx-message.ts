import type { SbxStatus } from '../../../contracts/api';

// Why sbx cannot be used, in the user's words. Undefined once it can.
export function sbxProblem(status: SbxStatus): string | undefined {
  switch (status.status) {
    case 'ok':
      return undefined;
    case 'missing':
      return 'sbx est introuvable sur cette machine.';
    case 'outdated':
      return `sbx ${status.version} est trop ancien (minimum ${status.minimum}).`;
    case 'error':
      return `sbx est installé mais ne répond pas : ${status.message}`;
  }
}
