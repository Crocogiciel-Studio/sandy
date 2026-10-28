import { MIN_SBX_VERSION, isSbxVersionSupported } from '../domain/sbx-version';
import type { SandboxProvider } from '../ports/sandbox-provider';

export type SbxStatus =
  | { status: 'ok'; version: string }
  | { status: 'missing' }
  | { status: 'outdated'; version: string; minimum: string };

// Tells whether sbx can be used at all, apart from sign-in: `list()` fails for both reasons.
// Rejects only when sbx is present but its version cannot be asked for.
export async function checkSbx(sandbox: Pick<SandboxProvider, 'checkInstall'>): Promise<SbxStatus> {
  const installed = await sandbox.checkInstall();
  if (!installed) return { status: 'missing' };
  if (!isSbxVersionSupported(installed.version)) {
    return { status: 'outdated', version: installed.version, minimum: MIN_SBX_VERSION };
  }
  return { status: 'ok', version: installed.version };
}
