import type { SbxStatus } from '../../../contracts/api';
import { useRecheck } from './use-recheck';

const checkSbx = (): Promise<SbxStatus> =>
  window.sandy.sbx
    .check()
    .catch((error: unknown): SbxStatus => ({ status: 'error', message: error instanceof Error ? error.message : String(error) }));

// sbx's status, undefined while the first check runs; rechecked on focus until sbx is usable.
export function useSbxStatus(): { status: SbxStatus | undefined; checking: boolean; recheck(): void } {
  const { value, checking, recheck } = useRecheck(checkSbx, (status) => status.status === 'ok');
  return { status: value, checking, recheck };
}
