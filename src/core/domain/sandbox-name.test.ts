import { describe, expect, it } from 'vitest';
import { isValidSandboxName } from './sandbox-name';

describe('isValidSandboxName', () => {
  it.each(['ab', 'my-sandbox', 'Project.v2', '1st-agent'])('accepts %s', (name) => {
    expect(isValidSandboxName(name)).toBe(true);
  });

  it.each(['', 'a', '-'])('rejects %j as too short', (name) => {
    expect(isValidSandboxName(name)).toBe(false);
  });

  it.each(['-sandbox', '.sandbox', 'my_sandbox', 'my sandbox', 'café', 'a/b'])(
    'rejects %j for forbidden characters',
    (name) => {
      expect(isValidSandboxName(name)).toBe(false);
    },
  );

  it('rejects the reserved name default', () => {
    expect(isValidSandboxName('default')).toBe(false);
  });
});
