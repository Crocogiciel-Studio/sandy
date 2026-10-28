export type ShellTokenKind = 'command' | 'flag' | 'string' | 'variable' | 'comment' | 'operator' | 'text';

export interface ShellToken {
  kind: ShellTokenKind;
  text: string;
}

// Whitespace, comment, quoted string, operator, variable, then any other word.
const PIECE = /(\s+)|(#.*)|('[^']*'|"(?:[^"\\]|\\.)*")|(\|\||&&|[|;]|>>?)|(\$\{[^}]*\}|\$\w+)|(\S+)/g;

// Splits one shell line into colourable pieces: enough for install one-liners (commands, flags,
// quoted strings, $VARS, NAME=value prefixes, pipes), not a shell parser.
export function tokenizeShell(line: string): ShellToken[] {
  const tokens: ShellToken[] = [];
  let expectCommand = true;
  for (const [text, space, comment, string, operator, variable] of line.matchAll(PIECE)) {
    if (space) tokens.push({ kind: 'text', text });
    else if (comment) tokens.push({ kind: 'comment', text });
    else if (string) tokens.push({ kind: 'string', text });
    else if (operator) {
      tokens.push({ kind: 'operator', text });
      expectCommand = true;
    } else if (variable) tokens.push({ kind: 'variable', text });
    else if (/^[A-Za-z_]\w*=/.test(text)) tokens.push({ kind: 'variable', text });
    else if (expectCommand) {
      tokens.push({ kind: 'command', text });
      expectCommand = text === 'sudo';
    } else tokens.push({ kind: text.startsWith('-') ? 'flag' : 'text', text });
  }
  return tokens;
}
