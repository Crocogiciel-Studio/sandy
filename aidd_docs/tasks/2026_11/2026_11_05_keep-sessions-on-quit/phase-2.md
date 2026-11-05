---
status: done
---

# Instruction: session registry and screen replay

## Architecture projection

```txt
package.json                                           ✏️
electron.vite.config.ts                                ✏️
src/contracts/pty-messages.ts                          ✏️
src/core/ports/terminal-provider.ts                    ✏️
src/pty-host/
├── index.ts                                           ✏️
├── screen.ts                                          ✅
└── screen.test.ts                                     ✅
src/adapters/terminal/node-pty/node-pty-terminal.ts    ✏️
src/core/use-cases/start-session.ts                    ✏️
src/core/use-cases/attach-session.ts                   ✏️
src/shell/electron/ipc/session.ts                      ✏️
```

## Test Scope

| Scenario | Action | Observable outcome | Actor |
| -------- | ------ | ------------------ | ----- |
| Setup | Open a session with metadata, print colored text and enter the alternate screen | Host holds the session | system |
| Happy path | `list` then `attach` from a new client | Metadata returned; `snapshot` replays into a fresh xterm to the same visible screen | system |
| Edge case | Resize the PTY then attach | Snapshot uses the new size | system |
| Edge case | `attach` an unknown or exited id | `attach-failed`, no crash | system |
| Edge case | Output arrives between `attach` and the snapshot | No byte lost nor duplicated | system |
| Teardown | Close the session | Headless terminal disposed | system |

## Tasks to do

### `1)` Screen model

> Know what each session shows, without the renderer.

1. Add `@xterm/headless` 6.0.0 and `@xterm/addon-serialize` 0.14.0 (exact versions, `package.json` and lockfile); bundle them into `pty-host` (`externalizeDeps.exclude`): the headless package is CommonJS and the host runs as plain Node.
2. `screen.ts`: per-session headless terminal with `unicode11`, fed with PTY data, resized with the PTY, `snapshot()` through the serialize addon.

### `2)` Registry protocol

> List the live sessions and attach to one.

1. Extend `open` with `meta: Record<string, string>` (opaque to the host); add `list` → `sessions` (id, meta, cols, rows, startedAt) and `attach` → `snapshot` (id, data) with the data queued after it, in order.
2. An exited session leaves the registry at once; a session that ended while sandy was closed is simply absent from `list`.

### `3)` Port and adapter

> The core can enumerate and re-attach terminals.

1. `TerminalProvider`: `list(): Promise<LiveTerminal[]>` and `attach(id): Promise<{ cols, rows, data }>` (the screen at the PTY's size; the UI sizes its xterm to it before writing); `open` takes `meta`.
2. `NodePtyTerminal`: implement both over the client.
3. `startSession`/`attachSession`: pass the sandbox name, project path, agent as `meta`.

### `4)` Main-process session map

> `ipc/session.ts` no longer owns the only copy of session metadata.

1. At startup rebuild `sessions` from `terminal.list()` metadata.
2. Add `session:list-live` (id, agent, projectPath, sandboxName, exited flag) returning what the renderer needs.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | A snapshot replayed into a second headless terminal gives an identical visible buffer, alternate screen included |
| 2 | `list` returns metadata of live sessions only; attach returns snapshot then live data with no gap |
| 3 | A fake `TerminalProvider` in core tests supports list/attach; core still imports nothing outside core |
| 4 | After a simulated main-process restart the session map equals the host's list |
