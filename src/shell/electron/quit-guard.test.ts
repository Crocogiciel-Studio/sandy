import { describe, expect, it } from 'vitest';
import { quitChoice, quitPrompt } from './quit-guard';

describe('quitPrompt', () => {
  it('does not ask when nothing runs', () => {
    expect(quitPrompt(0)).toBeUndefined();
  });

  it('names a single session', () => {
    expect(quitPrompt(1)?.message).toBe('Quit Sandy with 1 session running?');
  });

  it('counts several sessions', () => {
    expect(quitPrompt(3)?.message).toBe('Quit Sandy with 3 sessions running?');
  });

  it('keeps sessions running by default and cancels on dismiss', () => {
    const prompt = quitPrompt(2);
    expect(prompt?.buttons[prompt.defaultId]).toBe('Keep running');
    expect(prompt?.buttons[prompt.cancelId]).toBe('Cancel');
  });
});

describe('quitChoice', () => {
  it('maps each button to its outcome', () => {
    const prompt = quitPrompt(1);
    const choices = prompt?.buttons.map((_, index) => quitChoice(index));
    expect(choices).toEqual(['keep', 'stop', 'cancel']);
  });
});
