import { isValidSandboxName } from './sandbox-name';

const MAX_FOLDER_LENGTH = 40;

// `<agent>-<folder>-<hash>`: the hash of the full path keeps same-named folders apart
// and gives a project the same sandbox on every launch.
export function sessionName(agent: string, projectPath: string): string {
  const folder = slug(projectPath.split(/[\\/]/).filter(Boolean).pop() ?? '').slice(0, MAX_FOLDER_LENGTH);
  const name = [slug(agent), folder, shortHash(projectPath)].filter(Boolean).join('-');
  if (!isValidSandboxName(name)) throw new Error(`Cannot derive a sandbox name from ${agent} and ${projectPath}`);
  return name;
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
}

// FNV-1a 32-bit, first 6 hex digits.
function shortHash(value: string): string {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 6);
}
