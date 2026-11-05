---
status: pending
---

# Instruction: hide the window, confirm on quit

## Architecture projection

```txt
src/shell/electron/
├── main.ts          ✏️
├── quit-guard.ts    ✅
└── quit-guard.test.ts ✅
src/adapters/terminal/node-pty/node-pty-terminal.ts ✏️
aidd_docs/memory/desktop.md ✏️
```

## Test Scope

| Scenario | Action | Observable outcome | Actor |
| -------- | ------ | ------------------ | ----- |
| Setup | Start an agent session, run a full-screen TUI | Session visible | browser |
| Happy path | Close the window (red button / Cmd+W), then click the Dock icon | Same window returns with every terminal as left, agent still running | browser |
| Edge case | Quit with Cmd+Q with 2 sessions running | Dialog "2 sessions will stop", Cancel keeps the app, Quit stops agents | browser |
| Edge case | Quit with no running session | Quits without a dialog | browser |
| Teardown | Quit | Agents stopped | system |

## Tasks to do

### `1)` Quit guard

> Pure decision on whether quitting needs a confirmation, and its text.

1. Create `quit-guard.ts` with `quitPrompt(running: number): { message: string; detail: string } | undefined`: `undefined` at 0, singular/plural otherwise.
2. Cover 0, 1 and N in `quit-guard.test.ts`.

### `2)` Running count

> Let the shell know how many sessions would stop.

1. Add `runningCount(): number` to `NodePtyTerminal` (`this.running.size`).

### `3)` Hide on close

> The window disappears but is never destroyed unless the app quits.

1. In `main.ts`, keep a `quitting` flag set in `before-quit`.
2. On the window's `close`, when not `quitting`, call `event.preventDefault()` and `window.hide()` (macOS: also leave the Dock icon).
3. Remove the `closed → terminal.closeAll()` line.
4. `activate`: show the existing window (`show()`), create one only if none exists.

### `4)` Confirm on quit

> Quitting is the only way to stop every session at once, so it asks first.

1. In `before-quit`, if not already confirmed and `quitPrompt(terminal.runningCount())` returns a prompt: `preventDefault()`, show a `dialog.showMessageBox` (buttons "Quit", "Cancel", Cancel default).
2. On Quit, set `quitting`/confirmed and call `app.quit()` again; `terminal.dispose()` runs as today.
3. Update `aidd_docs/memory/desktop.md` (window hidden not destroyed; quit confirms).

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | `quitPrompt(0)` is `undefined`; 1 and N give the right wording |
| 2 | `runningCount()` follows opened and exited sessions |
| 3 | Closing the window leaves agents running; the Dock icon brings the same renderer back |
| 4 | Cancel keeps everything running; Quit stops the agents and exits |
