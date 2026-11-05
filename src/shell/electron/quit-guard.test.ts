import { describe, expect, it } from 'vitest';
import { quitPrompt } from './quit-guard';

describe('quitPrompt', () => {
  it('does not ask when nothing runs', () => {
    expect(quitPrompt(0)).toBeUndefined();
  });

  it('names a single session', () => {
    expect(quitPrompt(1)?.message).toBe('Quit Sandy and stop 1 session?');
  });

  it('counts several sessions', () => {
    expect(quitPrompt(3)?.message).toBe('Quit Sandy and stop 3 sessions?');
  });
});
