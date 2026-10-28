import { describe, expect, it } from 'vitest';
import { sbxProblem } from './sbx-message';

describe('sbxProblem', () => {
  it('says nothing when sbx is usable', () => {
    expect(sbxProblem({ status: 'ok', version: '0.49.2' })).toBeUndefined();
  });

  it('says sbx is missing', () => {
    expect(sbxProblem({ status: 'missing' })).toContain('introuvable');
  });

  it('names the version found and the minimum when sbx is too old', () => {
    const message = sbxProblem({ status: 'outdated', version: '0.40.0', minimum: '0.49.2' });
    expect(message).toContain('0.40.0');
    expect(message).toContain('0.49.2');
  });

  it('passes on the reason when sbx will not answer', () => {
    expect(sbxProblem({ status: 'error', message: 'boom' })).toContain('boom');
  });
});
