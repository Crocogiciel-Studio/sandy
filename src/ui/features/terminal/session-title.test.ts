import { describe, expect, it } from 'vitest';
import { parseTitle } from './session-title';

describe('parseTitle', () => {
  it('keeps a descriptive title', () => {
    expect(parseTitle('Fix login redirect', 'claude')).toBe('Fix login redirect');
  });

  it('drops leading spinner and status glyphs', () => {
    expect(parseTitle('✳ Fix login redirect', 'claude')).toBe('Fix login redirect');
    expect(parseTitle('⠂ Fix login redirect', 'claude')).toBe('Fix login redirect');
  });

  it('ignores generic and empty titles', () => {
    for (const raw of ['', '   ', '✳', 'Claude Code', '✳ Claude Code', 'claude', 'codex']) {
      expect(parseTitle(raw, 'claude')).toBeUndefined();
    }
  });

  it('ignores the agent name whatever its case', () => {
    expect(parseTitle('Aider', 'aider')).toBeUndefined();
  });

  it('collapses whitespace and truncates long titles', () => {
    expect(parseTitle('a   b\n c', 'claude')).toBe('a b c');
    const long = parseTitle('x'.repeat(200), 'claude');
    expect(long).toHaveLength(80);
    expect(long?.endsWith('…')).toBe(true);
  });
});
