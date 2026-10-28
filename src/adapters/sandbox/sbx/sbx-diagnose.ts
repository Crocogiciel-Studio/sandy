import type { SignInState } from '../../../core/ports/sandbox-provider';

// `sbx diagnose --json` is undocumented: this reads only the check named "Authentication"
// (shape observed on v0.49.2, signed in: status "pass"). Only a clear pass or fail decides;
// a missing check, a skip or any other status reads as unknown, so a changed format never locks the user out.
export function parseSignIn(json: string): SignInState {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return 'unknown';
  }
  const checks = typeof data === 'object' && data !== null ? (data as { checks?: unknown }).checks : undefined;
  if (!Array.isArray(checks)) return 'unknown';
  const check = checks.find((entry: unknown) => (entry as { name?: unknown } | null)?.name === 'Authentication') as { status?: unknown } | undefined;
  if (check?.status === 'pass') return 'signed-in';
  if (check?.status === 'fail') return 'signed-out';
  return 'unknown';
}
