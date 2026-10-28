import { describe, expect, it } from 'vitest';
import { isSbxVersionSupported, MIN_SBX_VERSION, parseSbxVersion } from './sbx-version';

describe('parseSbxVersion', () => {
  it('reads a version with or without the leading v', () => {
    expect(parseSbxVersion('v0.49.2')).toEqual([0, 49, 2]);
    expect(parseSbxVersion('0.49.2')).toEqual([0, 49, 2]);
  });

  it('ignores a suffix after the three numbers', () => {
    expect(parseSbxVersion('v0.50.0-rc.1')).toEqual([0, 50, 0]);
  });

  it('rejects anything that is not a version', () => {
    expect(parseSbxVersion('')).toBeUndefined();
    expect(parseSbxVersion('latest')).toBeUndefined();
    expect(parseSbxVersion('1.2')).toBeUndefined();
  });
});

describe('isSbxVersionSupported', () => {
  it('accepts the minimum and anything newer', () => {
    expect(isSbxVersionSupported(MIN_SBX_VERSION)).toBe(true);
    expect(isSbxVersionSupported('v0.49.3')).toBe(true);
    expect(isSbxVersionSupported('0.50.0')).toBe(true);
    expect(isSbxVersionSupported('1.0.0')).toBe(true);
  });

  it('compares numbers, not text', () => {
    expect(isSbxVersionSupported('0.9.0')).toBe(false);
    expect(isSbxVersionSupported('0.100.0')).toBe(true);
  });

  it('refuses older versions and unreadable ones', () => {
    expect(isSbxVersionSupported('0.49.1')).toBe(false);
    expect(isSbxVersionSupported('0.40.0')).toBe(false);
    expect(isSbxVersionSupported('unknown')).toBe(false);
  });
});
