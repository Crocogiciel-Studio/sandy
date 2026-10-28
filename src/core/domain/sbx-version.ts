// Oldest `sbx` sandy is written against: the only version its adapter has been checked on.
export const MIN_SBX_VERSION = '0.49.2';

// "v0.49.2" or "0.49.2" as [0, 49, 2]; undefined for anything else.
export function parseSbxVersion(text: string): [number, number, number] | undefined {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(text.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

// Compared part by part: "0.9.0" is older than "0.49.2", which a text comparison gets wrong.
export function isSbxVersionSupported(version: string): boolean {
  const found = parseSbxVersion(version);
  const minimum = parseSbxVersion(MIN_SBX_VERSION);
  if (!found || !minimum) return false;
  for (const [index, part] of found.entries()) {
    const required = minimum[index] ?? 0;
    if (part !== required) return part > required;
  }
  return true;
}
