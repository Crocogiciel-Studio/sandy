import { describe, expect, it } from 'vitest';
import { isInsideProject, sandboxDropPath } from './dropped-file';

describe('isInsideProject', () => {
  it('accepts files under the project', () => {
    expect(isInsideProject('/work/app', '/work/app/src/index.ts')).toBe(true);
  });

  it('rejects the project itself, siblings sharing a prefix, and other folders', () => {
    expect(isInsideProject('/work/app', '/work/app')).toBe(false);
    expect(isInsideProject('/work/app', '/work/app-2/a.ts')).toBe(false);
    expect(isInsideProject('/work/app', '/Users/me/Downloads/a.png')).toBe(false);
  });

  it('never matches an empty project path', () => {
    expect(isInsideProject('', '/a/b.ts')).toBe(false);
  });

  it('ignores separator style and trailing separators', () => {
    expect(isInsideProject('C:\\work\\app\\', 'C:\\work\\app\\src\\a.ts')).toBe(true);
  });
});

describe('sandboxDropPath', () => {
  it('builds a flat temp path from the id and file name', () => {
    expect(sandboxDropPath('ab12', '/Users/me/Downloads/Screenshot 1.png')).toBe('/tmp/sandy-drop-ab12-Screenshot_1.png');
  });

  it('keeps only the last segment of Windows paths', () => {
    expect(sandboxDropPath('ab12', 'C:\\Users\\me\\a.png')).toBe('/tmp/sandy-drop-ab12-a.png');
  });
});
