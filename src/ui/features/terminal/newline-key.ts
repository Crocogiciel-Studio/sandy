// Escape then Enter (Alt+Enter): the agents' "insert a newline" key, where a bare Enter submits.
const NEWLINE_INPUT = '\x1b\r';

interface KeyLike {
  type: string;
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

// What to type instead of Enter for Cmd/Ctrl/Shift+Enter, or undefined for any other key.
// xterm sends the same carriage return for all of them, so the agent would submit the prompt.
export function newlineInputFor(event: KeyLike): string | undefined {
  if (event.type !== 'keydown' || event.key !== 'Enter' || event.altKey) return undefined;
  return event.metaKey || event.ctrlKey || event.shiftKey ? NEWLINE_INPUT : undefined;
}
