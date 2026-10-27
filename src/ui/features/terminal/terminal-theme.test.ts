import { describe, expect, it } from 'vitest';
import { terminalTheme } from './terminal-theme';

describe('terminalTheme', () => {
  const theme = terminalTheme((name) => `value of ${name}`);

  it('takes the surface colors from the app tokens', () => {
    expect(theme.background).toBe('value of --bg');
    expect(theme.foreground).toBe('value of --text');
    expect(theme.cursor).toBe('value of --isolated');
  });

  it('maps the 16 ANSI colors, bright ones included', () => {
    expect(theme.red).toBe('value of --term-red');
    expect(theme.brightCyan).toBe('value of --term-bright-cyan');
  });

  it('defines every ANSI slot', () => {
    const slots = [
      'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
      'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
    ] as const;
    for (const slot of slots) expect(theme[slot]).toBeTruthy();
  });
});
