import { describe, expect, it } from 'vitest';
import { checkSbx } from './check-sbx';

const sandbox = (installed: { version: string } | undefined) => ({ checkInstall: async () => installed });

describe('checkSbx', () => {
  it('is ok on the minimum version', async () => {
    expect(await checkSbx(sandbox({ version: '0.49.2' }))).toEqual({ status: 'ok', version: '0.49.2' });
  });

  it('is missing when sbx is not installed', async () => {
    expect(await checkSbx(sandbox(undefined))).toEqual({ status: 'missing' });
  });

  it('is outdated, with the version found and the minimum, on an older sbx', async () => {
    expect(await checkSbx(sandbox({ version: '0.9.0' }))).toEqual({
      status: 'outdated',
      version: '0.9.0',
      minimum: '0.49.2',
    });
  });

  it('lets a failure to ask for the version surface', async () => {
    const failing = {
      checkInstall: async () => {
        throw new Error('sbx version a échoué');
      },
    };
    await expect(checkSbx(failing)).rejects.toThrow('sbx version a échoué');
  });
});
