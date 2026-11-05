---
objective: "Quitting sandy leaves agent sessions running in a detached host; relaunching sandy shows them again with their screen, and an explicit stop leaves no orphan process."
status: implemented
---

# Plan: keep sessions when sandy quits

Source: GitHub issue #78

## Phases

| #   | Phase                                    | File                         | Depends on |
| --- | ---------------------------------------- | ---------------------------- | ---------- |
| 1   | Detached pty-host reached by socket      | [`phase-1.md`](./phase-1.md) | none |
| 2   | Session registry and screen replay       | [`phase-2.md`](./phase-2.md) | 1 |
| 3   | Quit choice, lifecycle, version mismatch | [`phase-3.md`](./phase-3.md) | 1, 2 |
| 4   | Restore sessions in the UI               | [`phase-4.md`](./phase-4.md) | 2, 3 |

## External sources

| URL   | What it settled   |
| ----- | ----------------- |
| none | none |

## Impact

| Category | Verdict and evidence | Handled in |
| -------- | -------------------- | ---------- |
| Runtime | A detached child started with `ELECTRON_RUN_AS_NODE=1` running `pty-host.js` from the asar with node-pty: unverified here (no display, no packaged build), to check on the Mac with `pnpm dist` | phase 1 |
| Runtime | `@xterm/headless` 6.0.0 and `@xterm/addon-serialize` 0.14.0 exist on npm (observed); the serialized output replays correctly into a fresh xterm, alternate screen included: unverified, to check in a test and on the Mac | phase 2 |
| Runtime | Windows named pipe and ConPTY under a detached process: unverified, no Windows machine (#54) | phase 1, 3 |
| Regression | `src/pty-host/index.test.ts` (91 lines) covers `createPtyHost` through callbacks; no test covers `node-pty-terminal.ts`, `main.ts` or `ipc/*`; risk high, the whole terminal path changes transport | phase 1 (tests before moving the transport) |
| Regression | `ipc/session.ts` keeps `sessions` in the main process memory and the renderer keeps `running`: both are lost on quit today and must now be rebuilt | phase 2, 4 |
| Architecture | `TerminalProvider` (port) gains `list` and `attach`; the adapter swaps `utilityProcess` for a socket client; the host becomes a server. `core` stays pure and the dependency rule is untouched | phase 1, 2 |
| Architecture | `sbx` stays the source of truth for sandboxes; the host only holds the PTYs and the per-session metadata sandy needs to rebuild its list (sandbox name, project path, start time, agent) | phase 2 |
| Regression | #84 (c922b92) kept every xterm in the renderer and added no host-side buffer or protocol, so nothing from level 1 is reusable: the screen model is new (observed in `main.ts`, `pty-host/index.ts`). `ipc/session.ts` also keeps `allowedHosts` per session; restored sessions start with it empty, which only re-lists a host sbx still blocks | phase 2 |
| Runtime | `pty-host/index.ts` builds each PTY env from the host's own `process.env`/PATH, frozen at launch: `open` must carry the env of the client, not the host's | phase 1 |
| Runtime | An app update replaces the asar, `node-pty` and the Electron binary under a live old host: whether it still answers `hello`/`shutdown`, and whether the old binary survives, is unverified, to check on the Mac | phase 3 |
| Runtime | Force-quit or crash of sandy leaves the host and agents alive (intended); `pty.kill()` ending the agent's whole process tree is unverified | phase 3 |
| Cost | A detached host and its agents keep using RAM and tokens with sandy closed; the dialog says so and the host exits on its own when it holds no session | phase 3 |
| Architecture | `electron.vite.config.ts` externals gain the xterm headless packages if the bundler needs it; `main.ts` quit flow: the three-button dialog feeds the existing `quitting` flag and `app.quit()` re-entry, and the tray Quit on Windows/Linux goes through the same `before-quit` | phase 2, 3 |
| Documentation | `aidd_docs/memory/desktop.md`, `architecture.md` (diagram: PTY host detached), `codebase-map.md` (`pty-host`), `testing.md` if the host test strategy changes | phase 4 |

## Rules

| Rule | Why it applies |
| ---- | -------------- |
| `core` imports nothing outside `core` | the port change must not leak Electron or Node |
| Interface in English only | the quit dialog and mismatch message are UI text |
| Reuse before building | `@xterm/headless` + `addon-serialize` instead of an own screen model |
| `pnpm typecheck`, `pnpm lint` before commit; `pnpm test`, `pnpm build` before push | project assertions |
| No attribution metadata in commits and PRs | vcs.md and memory |

## Decisions

| Decision | Why |
| -------- | --- |
| The host is a detached Electron-as-node process (`ELECTRON_RUN_AS_NODE=1`, `detached`, `unref`), not a system `node` | The app cannot rely on a user's Node; the Electron binary is always there and node-pty ships N-API prebuilds |
| Newline-delimited JSON over a Unix socket in `userData` (dir `0700`, socket `0600`), a named pipe on Windows, with a protocol version and a random token read from a `0600` file | Same messages as today (`PtyRequest`/`PtyEvent`) plus `list`/`attach`; the token guards the pipe where file modes do not apply |
| Screen state is rebuilt from a headless xterm kept per session in the host | The renderer that held the screens dies with the app (unlike #84); replaying raw output would need an unbounded buffer and loses the alternate screen |
| Quit offers "Keep running" (default) and "Stop sessions", plus Cancel | #56 product decision: sessions persist by default, stopping is explicit |
| The host exits when it holds no session and no client is connected for 30 s, and on an explicit `shutdown` | No orphan process after an explicit stop or after the last agent ends |
| A host with a different protocol version is not reattached: sandy tells the user and offers to stop those sessions (or quit) through a `shutdown` message whose shape never changes | An update must not strand invisible agents, and must not silently kill them either |
| Sessions that ended while sandy was closed are dropped from the host at the next `list` | Keeps the host simple; the sandbox itself remains reachable from the project page |
