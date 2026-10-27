import { describe, expect, it } from 'vitest';
import { formatDroppedPaths } from './dropped-paths';

describe('formatDroppedPaths', () => {
  it('leaves simple paths as is, with a trailing space', () => {
    expect(formatDroppedPaths(['/work/app/src/index.ts'])).toBe('/work/app/src/index.ts ');
  });

  it('separates several paths with spaces', () => {
    expect(formatDroppedPaths(['/a/b.ts', '/a/c.ts'])).toBe('/a/b.ts /a/c.ts ');
  });

  it('single-quotes paths with spaces or shell characters', () => {
    expect(formatDroppedPaths(['/my work/a file.ts'])).toBe("'/my work/a file.ts' ");
    expect(formatDroppedPaths(['/a/$HOME;rm.ts'])).toBe("'/a/$HOME;rm.ts' ");
  });

  it('quotes backslashes so Linux shells keep them literally', () => {
    expect(formatDroppedPaths(['C:\\work\\a.ts'])).toBe("'C:\\work\\a.ts' ");
  });

  it('escapes single quotes', () => {
    expect(formatDroppedPaths(["/a/it's.ts"])).toBe("'/a/it'\\''s.ts' ");
  });

  it('strips control characters so a drop never submits the input', () => {
    expect(formatDroppedPaths(['/a/b\n.ts'])).toBe('/a/b.ts ');
  });

  it('returns nothing for no paths', () => {
    expect(formatDroppedPaths([])).toBe('');
  });
});
