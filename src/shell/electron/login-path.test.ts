import { delimiter } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mergePaths, parseLoginPath } from './login-path';

describe('parseLoginPath', () => {
  it('ignores rc file noise around the markers', () => {
    expect(parseLoginPath('welcome\n__SANDY_PATH__/a:/b__SANDY_PATH__\nbye')).toBe('/a:/b');
  });

  it('is undefined without markers or with an empty path', () => {
    expect(parseLoginPath('nothing')).toBeUndefined();
    expect(parseLoginPath('__SANDY_PATH____SANDY_PATH__')).toBeUndefined();
  });
});

describe('mergePaths', () => {
  it('puts the login path first and drops duplicates', () => {
    const join = (...parts: string[]) => parts.join(delimiter);
    expect(mergePaths(join('/a', '/b'), join('/b', '/c'))).toBe(join('/a', '/b', '/c'));
  });
});
