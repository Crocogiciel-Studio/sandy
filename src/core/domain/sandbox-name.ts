// Naming rule enforced by `sbx create --name`.
const SANDBOX_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.-]+$/;
const RESERVED_NAMES = new Set(['default']);

export function isValidSandboxName(name: string): boolean {
  return SANDBOX_NAME_PATTERN.test(name) && !RESERVED_NAMES.has(name);
}
