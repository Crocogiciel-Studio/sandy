// `sbx version --json` is undocumented: this reads only `client.version` (shape observed on v0.49.2,
// spelled "v0.49.2") and gives up quietly on anything else, so a changed format reads as unknown.
export function parseSbxVersionOutput(json: string): string | undefined {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return undefined;
  }
  if (typeof data !== 'object' || data === null) return undefined;
  const { client } = data as { client?: unknown };
  if (typeof client !== 'object' || client === null) return undefined;
  const { version } = client as { version?: unknown };
  return typeof version === 'string' && version.trim() !== '' ? version.trim().replace(/^v/, '') : undefined;
}
