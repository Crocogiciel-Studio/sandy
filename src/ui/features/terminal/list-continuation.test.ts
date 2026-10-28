import { describe, expect, it } from 'vitest';
import { listContinuationFor } from './list-continuation';

const atEnd = (row: string) => listContinuationFor(row, row.length);

describe('listContinuationFor', () => {
  it.each(['-', '*', '+'])('continues a %s bullet', (bullet) => {
    expect(atEnd(`> ${bullet} item`)).toBe(`\x1b\r${bullet} `);
  });

  it('keeps the indentation of a nested bullet', () => {
    expect(atEnd('>   - nested')).toBe('\x1b\r  - ');
  });

  it('numbers the next item of an ordered list', () => {
    expect(atEnd('> 1. first')).toBe('\x1b\r2. ');
    expect(atEnd('> 9) ninth')).toBe('\x1b\r10) ');
  });

  it('reads continuation lines, indented by the prompt gutter', () => {
    expect(atEnd('  - second')).toBe('\x1b\r- ');
  });

  it('reads through the frame some versions draw', () => {
    expect(atEnd('│ > - item                │')).toBe('\x1b\r- ');
  });

  it('erases an empty item to end the list', () => {
    expect(atEnd('> -')).toBe('\x7f\x7f');
    expect(atEnd('>   - ')).toBe('\x7f'.repeat(4));
    expect(atEnd('> 12.')).toBe('\x7f'.repeat(4));
  });

  it('does nothing outside a list', () => {
    expect(atEnd('> hello')).toBeUndefined();
    expect(atEnd('> -not a bullet')).toBeUndefined();
    expect(atEnd('> ---')).toBeUndefined();
    expect(atEnd('')).toBeUndefined();
  });

  it('does nothing when the cursor is not at the end of the line', () => {
    expect(listContinuationFor('> - item', 4)).toBeUndefined();
  });

  it('accepts a cursor past a typed trailing space', () => {
    expect(listContinuationFor('> - item', 9)).toBe('\x1b\r- ');
  });
});
