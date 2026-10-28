import type { SignInState } from '../../../contracts/api';
import { useRecheck } from './use-recheck';

const POLL_MS = 3000;

// A failed check reads as unknown: sandy lets the user through rather than block on a probe.
const checkSignIn = (): Promise<SignInState> => window.sandy.sbx.checkSignIn().catch((): SignInState => 'unknown');

// Whether sbx is signed in to Docker, undefined while the first check runs. Only asked once sbx is usable,
// and rechecked on focus and every few seconds until signed in: the browser login ends without notifying sandy.
export function useSignIn(enabled: boolean): { state: SignInState | undefined; checking: boolean; recheck(): void } {
  const { value, checking, recheck } = useRecheck(checkSignIn, (state) => state !== 'signed-out', enabled, POLL_MS);
  return { state: value, checking, recheck };
}
