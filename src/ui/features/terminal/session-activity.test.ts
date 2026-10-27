import { describe, expect, it } from 'vitest';
import { parseActivity } from './session-activity';

describe('parseActivity', () => {
  it.each(['working', 'waiting', 'attention'])('accepts %s', (payload) => {
    expect(parseActivity(payload)).toBe(payload);
  });

  it('ignores anything else', () => {
    expect(parseActivity('')).toBeUndefined();
    expect(parseActivity('done')).toBeUndefined();
  });
});
