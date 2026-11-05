import { SerializeAddon } from '@xterm/addon-serialize';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { Terminal, type ITerminalAddon } from '@xterm/headless';

const SCROLLBACK_LINES = 1000;

export interface ScreenSnapshot {
  cols: number;
  rows: number;
  // Escape sequences that redraw the screen (alternate screen and colors included) in an xterm of that size.
  data: string;
}

// What a session currently shows, kept by a headless xterm so a window that opens later can redraw it.
export interface Screen {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  // Covers everything written before the call; `undefined` if the screen was disposed meanwhile.
  snapshot(): Promise<ScreenSnapshot | undefined>;
  dispose(): void;
}

export function createScreen(cols: number, rows: number): Screen {
  // The proposed API is what the Unicode 11 addon needs: agents lay out emoji as two cells.
  const terminal = new Terminal({ cols, rows, scrollback: SCROLLBACK_LINES, allowProposedApi: true });
  const serialize = new SerializeAddon();
  // The addons are typed against the browser Terminal, which the headless one mirrors.
  terminal.loadAddon(new Unicode11Addon() as unknown as ITerminalAddon);
  terminal.unicode.activeVersion = '11';
  terminal.loadAddon(serialize as unknown as ITerminalAddon);

  const waiting = new Set<() => void>();
  return {
    write: (data) => terminal.write(data),
    resize: (nextCols, nextRows) => terminal.resize(nextCols, nextRows),
    snapshot: () =>
      new Promise((resolve) => {
        const abandon = (): void => resolve(undefined);
        waiting.add(abandon);
        // The empty write is queued behind everything already written: its callback runs once that is parsed.
        terminal.write('', () => {
          waiting.delete(abandon);
          resolve({ cols: terminal.cols, rows: terminal.rows, data: serialize.serialize() });
        });
      }),
    dispose: () => {
      waiting.forEach((abandon) => abandon());
      waiting.clear();
      terminal.dispose();
    },
  };
}
