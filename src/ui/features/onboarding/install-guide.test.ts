import { describe, expect, it } from 'vitest';
import { installGuide } from './install-guide';

describe('installGuide', () => {
  it.each([
    ['darwin', 'macOS'],
    ['win32', 'Windows'],
    ['linux', 'Linux'],
  ])('gives %s its own steps', (platform, os) => {
    const guide = installGuide(platform);
    expect(guide.os).toBe(os);
    expect(guide.steps.length).toBeGreaterThan(1);
  });

  it('falls back to the Linux steps on any other Unix', () => {
    expect(installGuide('freebsd').os).toBe('Linux');
  });

  it('keeps commands out of the sentences', () => {
    const commands = installGuide('darwin').steps.flatMap((step) => (step.command ? [step.command] : []));
    expect(commands).toEqual(['brew trust docker/tap\nbrew install docker/tap/sbx']);
    expect(installGuide('win32').steps[0]?.command).toBe('winget install -h Docker.sbx');
  });

  it('ends every guide by saying the check restarts by itself', () => {
    for (const platform of ['darwin', 'win32', 'linux']) {
      expect(installGuide(platform).steps.at(-1)?.text).toContain('vérification');
    }
  });
});
