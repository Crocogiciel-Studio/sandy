import type { ITheme } from '@xterm/xterm';

// Builds the xterm palette from the CSS tokens, so the terminal always matches the app theme.
export function terminalTheme(token: (name: string) => string): ITheme {
  return {
    background: token('--bg'),
    foreground: token('--text'),
    cursor: token('--isolated'),
    cursorAccent: token('--bg'),
    selectionBackground: token('--term-selection'),
    black: token('--term-black'),
    red: token('--term-red'),
    green: token('--term-green'),
    yellow: token('--term-yellow'),
    blue: token('--term-blue'),
    magenta: token('--term-magenta'),
    cyan: token('--term-cyan'),
    white: token('--term-white'),
    brightBlack: token('--term-bright-black'),
    brightRed: token('--term-bright-red'),
    brightGreen: token('--term-bright-green'),
    brightYellow: token('--term-bright-yellow'),
    brightBlue: token('--term-bright-blue'),
    brightMagenta: token('--term-bright-magenta'),
    brightCyan: token('--term-bright-cyan'),
    brightWhite: token('--term-bright-white'),
  };
}

const readToken = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const currentTerminalTheme = (): ITheme => terminalTheme(readToken);

export const terminalFont = (): string => readToken('--font-mono');

// Re-themes `apply` whenever the system switches between dark and light; returns the unsubscribe.
export function followSystemTheme(apply: (theme: ITheme) => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = (): void => apply(currentTerminalTheme());
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
