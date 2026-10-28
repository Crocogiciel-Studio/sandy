import { describe, expect, it } from 'vitest';
import { newlineInputFor } from './newline-key';

const key = (overrides: Partial<Parameters<typeof newlineInputFor>[0]> = {}) => ({
  type: 'keydown',
  key: 'Enter',
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...overrides,
});

describe('newlineInputFor', () => {
  it.each(['metaKey', 'ctrlKey', 'shiftKey'] as const)('turns %s+Enter into a newline', (modifier) => {
    expect(newlineInputFor(key({ [modifier]: true }))).toBe('\x1b\r');
  });

  it('leaves a bare Enter alone so it submits', () => {
    expect(newlineInputFor(key())).toBeUndefined();
  });

  it('leaves Alt+Enter alone, it already sends the newline', () => {
    expect(newlineInputFor(key({ altKey: true, metaKey: true }))).toBeUndefined();
  });

  it('ignores keyup and other keys', () => {
    expect(newlineInputFor(key({ type: 'keyup', metaKey: true }))).toBeUndefined();
    expect(newlineInputFor(key({ key: 'a', metaKey: true }))).toBeUndefined();
  });
});
