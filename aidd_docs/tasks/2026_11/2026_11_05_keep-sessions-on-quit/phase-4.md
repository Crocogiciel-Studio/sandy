---
status: pending
---

# Instruction: restore sessions in the UI

## Architecture projection

```txt
src/contracts/api.ts                                   ✏️
src/shell/electron/preload/index.ts                    ✏️
src/shell/electron/ipc/terminal.ts                     ✏️
src/ui/app/App.tsx                                     ✏️
src/ui/features/terminal/Terminal.tsx                  ✏️
aidd_docs/memory/desktop.md                            ✏️
aidd_docs/memory/architecture.md                       ✏️
aidd_docs/memory/codebase-map.md                       ✏️
```

## Test Scope

| Scenario | Action | Observable outcome | Actor |
| -------- | ------ | ------------------ | ----- |
| Setup | Two sessions, one in a full-screen TUI, quit with Keep running | Host alive | browser |
| Happy path | Relaunch sandy | Both sessions in the sidebar under their projects, screens as left, input works | browser |
| Edge case | Resize the window after restore | Agent redraws at the new size | browser |
| Edge case | No live session | Normal empty start | browser |
| Edge case | Close a restored session | Same as a fresh one: PTY closed | browser |
| Teardown | Quit with Stop | Nothing left running | system |

## Tasks to do

### `1)` API

> Expose the live sessions to the renderer.

1. `SessionApi.listLive()`; `TerminalApi.attach(id, cols, rows): Promise<string>`; preload and `ipc` handlers with the same argument validation as `isSize`.

### `2)` Restore on startup

> Rebuild `running` from the host.

1. Refactor `openTerminal` so the xterm wiring takes an existing id and an initial snapshot (write the snapshot first, then live data, nothing dropped between).
2. In `Sessions`, on mount call `listLive()`, rebuild each `OpenSession` (label from the agent, title left unset until the agent republishes it), keep the active session `new` or the first restored.
3. Do it once even under StrictMode.

### `3)` Documentation

> Memory files describe the new reality.

1. `desktop.md`: quit keeps sessions, host detached, tray unchanged; `architecture.md` diagram and the gotcha about the host dying with the app; `codebase-map.md` `pty-host` line.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | Invalid ids or sizes are refused like the existing handlers |
| 2 | Sessions reappear with their screen and accept input; exited ones do not appear; StrictMode does not duplicate tabs |
| 3 | The three memory files match the code |
