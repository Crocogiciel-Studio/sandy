const NEWLINE_INPUT = '\x1b\r';
const BACKSPACE = '\x7f';

// Claude Code draws its input as "> text", with continuation lines indented by two columns,
// possibly inside a "│ … │" frame. Only this prompt chrome is stripped, never the user's indent.
const FRAME_LEFT = /^\s*│ ?/;
const FRAME_RIGHT = /\s*│\s*$/;
const GUTTER = /^(?:> | {2})/;
const LIST_ITEM = /^(\s*)(?:([-*+])|(\d+)([.)]))(?: (.*))?$/;

// What to type for a "newline" key pressed on this row of the agent's input, or undefined when
// the row is not a list item (or the cursor is not at its end) and the plain newline applies.
// A filled item continues the list; an empty one is erased, which ends the list.
export function listContinuationFor(row: string, cursorX: number): string | undefined {
  const bare = row.replace(FRAME_RIGHT, '').trimEnd();
  if (cursorX < bare.length) return undefined;
  const item = LIST_ITEM.exec(bare.replace(FRAME_LEFT, '').replace(GUTTER, ''));
  if (!item) return undefined;
  const [, indent = '', bullet, number, delimiter, text] = item;
  const marker = bullet ?? `${Number(number) + 1}${delimiter}`;
  if (text === undefined || text === '') {
    const typed = indent.length + (bullet ?? `${number}${delimiter}`).length + 1;
    return BACKSPACE.repeat(typed);
  }
  return `${NEWLINE_INPUT}${indent}${marker} `;
}
