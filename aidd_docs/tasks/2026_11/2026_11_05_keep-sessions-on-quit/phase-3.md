---
status: pending
---

# Instruction: quit choice, lifecycle, version mismatch

## Architecture projection

```txt
src/shell/electron/
├── main.ts                                            ✏️
├── quit-guard.ts                                      ✏️
└── quit-guard.test.ts                                 ✏️
src/adapters/terminal/node-pty/node-pty-terminal.ts    ✏️
```

## Test Scope

| Scenario | Action | Observable outcome | Actor |
| -------- | ------ | ------------------ | ----- |
| Setup | Two sessions running | Quit dialog available | browser |
| Happy path | Quit, choose Keep running, relaunch | App exits, host and agents alive, same sessions listed | browser |
| Edge case | Quit, choose Stop sessions | Agents stopped, host process gone | browser |
| Edge case | Quit with no session | No dialog, host gone | browser |
| Edge case | Host with another protocol version | Dialog offers to stop those sessions; sandy does not reattach | system |
| Edge case | Cancel | Nothing changes | browser |

## Tasks to do

### `1)` Quit prompt

> Three outcomes: cancel, keep running, stop.

1. `quitPrompt` returns the message, detail (RAM and tokens keep being used) and buttons; add a pure `quitChoice(buttonIndex)` mapping.
2. Cover 0, 1 and N sessions and each choice.

### `2)` Quit behavior

> Keep running means disconnect only.

1. `main.ts`: on Keep running, disconnect the client without killing anything; on Stop, send `close` for every session then `shutdown`; with no session, send `shutdown`.
2. `NodePtyTerminal`: `disconnect()` and `shutdown()` replace `dispose()`'s kill-all.

### `3)` Version mismatch

> Never strand invisible agents, never kill them silently.

1. On `hello-refused` for protocol, show a dialog; "Stop them" sends `shutdown` over a handshake that has the same shape in every version; "Not now" starts without the host features and leaves it alone.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | Prompt text and button mapping are covered; 0 sessions gives no prompt |
| 2 | After Keep running, `ps` shows the host and agents; after Stop, neither |
| 3 | A host started with a fake higher protocol version triggers the dialog and is not driven |
