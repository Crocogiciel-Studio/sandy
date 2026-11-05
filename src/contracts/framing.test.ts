import { describe, expect, it } from 'vitest';
import { createLineDecoder, encodeMessage } from './framing';

function decode(chunks: string[]): unknown[] {
  const messages: unknown[] = [];
  const push = createLineDecoder((message) => messages.push(message));
  chunks.forEach(push);
  return messages;
}

describe('framing', () => {
  it('round-trips a message', () => {
    expect(decode([encodeMessage({ type: 'write', id: 'a', data: 'x\ny' })])).toEqual([{ type: 'write', id: 'a', data: 'x\ny' }]);
  });

  it('waits for a message split across chunks', () => {
    const line = encodeMessage({ type: 'data', data: 'héllo' });
    expect(decode([line.slice(0, 5), line.slice(5)])).toEqual([{ type: 'data', data: 'héllo' }]);
  });

  it('delivers several messages from one chunk', () => {
    expect(decode([encodeMessage({ n: 1 }) + encodeMessage({ n: 2 })])).toEqual([{ n: 1 }, { n: 2 }]);
  });

  it('skips a malformed line and keeps going', () => {
    expect(decode(['not json\n', encodeMessage({ n: 1 })])).toEqual([{ n: 1 }]);
  });
});
