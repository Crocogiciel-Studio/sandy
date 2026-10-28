import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSbxVersionOutput } from './sbx-version';

// Contract test: the fixture is a real `sbx version --json` capture (sbx v0.49.2).
const fixture = readFileSync(join(import.meta.dirname, '__fixtures__/version.json'), 'utf8');

describe('parseSbxVersionOutput', () => {
  it('reads the client version from a real sbx capture, without the leading v', () => {
    expect(parseSbxVersionOutput(fixture)).toBe('0.49.2');
  });

  it('does not depend on the server part', () => {
    expect(parseSbxVersionOutput('{"client":{"version":"v0.50.0"}}')).toBe('0.50.0');
  });

  it('returns undefined instead of throwing on unexpected output', () => {
    expect(parseSbxVersionOutput('not json')).toBeUndefined();
    expect(parseSbxVersionOutput('[]')).toBeUndefined();
    expect(parseSbxVersionOutput('null')).toBeUndefined();
    expect(parseSbxVersionOutput('{}')).toBeUndefined();
    expect(parseSbxVersionOutput('{"client":{"version":42}}')).toBeUndefined();
    expect(parseSbxVersionOutput('{"client":{"version":" "}}')).toBeUndefined();
  });
});
