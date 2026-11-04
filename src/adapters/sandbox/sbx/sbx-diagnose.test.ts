import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSignIn } from './sbx-diagnose';

// Contract test: the fixture is a trimmed `sbx diagnose --json` capture (sbx v0.49.2, signed in).
const fixture = readFileSync(join(import.meta.dirname, '__fixtures__/diagnose.json'), 'utf8');

const withAuthentication = (status: string) =>
  JSON.stringify({ checks: [{ name: 'Authentication', status, message: 'x' }] });

describe('parseSignIn', () => {
  it('reads signed in from a real sbx capture', () => {
    expect(parseSignIn(fixture)).toBe('signed-in');
  });

  // The signed-out capture has not been taken yet: a failing check is the assumed shape.
  it('reads a failing Authentication check as signed out', () => {
    expect(parseSignIn(withAuthentication('fail'))).toBe('signed-out');
  });

  it('does not decide on a warning or a skip', () => {
    expect(parseSignIn(withAuthentication('warn'))).toBe('unknown');
    expect(parseSignIn(withAuthentication('skip'))).toBe('unknown');
  });

  it('is unknown when the check is missing or the output is unexpected', () => {
    expect(parseSignIn('{"checks":[{"name":"Daemon","status":"pass"}]}')).toBe('unknown');
    expect(parseSignIn('{"checks":{}}')).toBe('unknown');
    expect(parseSignIn('not json')).toBe('unknown');
    expect(parseSignIn('null')).toBe('unknown');
    expect(parseSignIn('{"checks":[null]}')).toBe('unknown');
  });
});
