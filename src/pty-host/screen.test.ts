import { Unicode11Addon } from '@xterm/addon-unicode11';
import { Terminal, type ITerminalAddon } from '@xterm/headless';
import { describe, expect, it } from 'vitest';
import { createScreen } from './screen';

const write = (terminal: Terminal, data: string): Promise<void> => new Promise((resolve) => terminal.write(data, resolve));

function visible(terminal: Terminal): string[] {
  const buffer = terminal.buffer.active;
  return Array.from({ length: terminal.rows }, (_, row) => buffer.getLine(buffer.baseY + row)?.translateToString(true) ?? '');
}

async function replay(snapshot: { cols: number; rows: number; data: string }): Promise<Terminal> {
  const terminal = new Terminal({ cols: snapshot.cols, rows: snapshot.rows, allowProposedApi: true });
  // Like the real xterm of the UI, which uses Unicode 11 widths.
  terminal.loadAddon(new Unicode11Addon() as unknown as ITerminalAddon);
  terminal.unicode.activeVersion = '11';
  await write(terminal, snapshot.data);
  return terminal;
}

describe('screen', () => {
  it('replays the visible screen, colors included, into a fresh terminal', async () => {
    const screen = createScreen(40, 5);
    screen.write('plain\r\n\u001b[31mred\u001b[0m text\r\n');
    const snapshot = await screen.snapshot();
    if (!snapshot) throw new Error('no snapshot');

    const copy = await replay(snapshot);

    expect(visible(copy).slice(0, 2)).toEqual(['plain', 'red text']);
    expect(snapshot.data).toContain('\u001b[31m');
  });

  it('replays the alternate screen of a full-screen program', async () => {
    const screen = createScreen(40, 5);
    screen.write('shell prompt\r\n\u001b[?1049h\u001b[2J\u001b[1;1HTUI header\u001b[3;1Hstatus line');
    const snapshot = await screen.snapshot();
    if (!snapshot) throw new Error('no snapshot');

    const copy = await replay(snapshot);

    expect(copy.buffer.active.type).toBe('alternate');
    expect(visible(copy)[0]).toBe('TUI header');
    expect(visible(copy)[2]).toBe('status line');
  });

  it('follows a resize', async () => {
    const screen = createScreen(40, 5);
    screen.write('hello');
    screen.resize(100, 20);

    const snapshot = await screen.snapshot();

    expect(snapshot).toMatchObject({ cols: 100, rows: 20 });
  });

  it('lays out emoji as two cells', async () => {
    const screen = createScreen(40, 5);
    screen.write('🌿ab');
    const snapshot = await screen.snapshot();
    if (!snapshot) throw new Error('no snapshot');
    const copy = await replay(snapshot);

    expect(copy.buffer.active.getLine(0)?.getCell(2)?.getChars()).toBe('a');
  });

  it('gives up a pending snapshot when disposed', async () => {
    const screen = createScreen(40, 5);
    const pending = screen.snapshot();
    screen.dispose();

    expect(await pending).toBeUndefined();
  });
});
