---
status: done
---

# Instruction: detached pty-host reached by socket

## Architecture projection

```txt
src/contracts/pty-messages.ts                          ✏️
src/pty-host/
├── index.ts                                           ✏️
├── server.ts                                          ✅
├── server.test.ts                                     ✅
└── paths.ts                                           ✅
src/adapters/terminal/node-pty/
├── node-pty-terminal.ts                               ✏️
├── host-launcher.ts                                   ✅
└── host-client.ts                                     ✅
src/shell/electron/main.ts                             ✏️
electron.vite.config.ts                                ✏️
```

## Test Scope

| Scenario | Action | Observable outcome | Actor |
| -------- | ------ | ------------------ | ----- |
| Setup | Start the host server on a temp socket | Socket accepts a client | system |
| Happy path | Client sends `open`, `write`, `resize`, `close` over the socket | Same `opened`, `data`, `exit` events as the in-process host | system |
| Edge case | Client connects with a wrong token | Connection closed, nothing executed | system |
| Edge case | Client disconnects while a PTY runs | PTY keeps running | system |
| Edge case | Message split across two socket chunks | Parsed once complete | system |
| Edge case | Last PTY exits with no client connected | Server exits after 30 s | system |
| Teardown | `shutdown` | PTYs killed, server closed, socket file removed | system |

## Tasks to do

### `1)` Socket framing and handshake

> A tiny, tested wire format shared by host and client.

1. In `pty-messages.ts` add an `env` field to `open` (the client's environment, never the host's), and add `hello` (`protocol`, `token`), `hello-ok`, `hello-refused` and `shutdown`; export `PROTOCOL_VERSION`.
2. Add newline-delimited JSON encode/decode with partial-chunk buffering, used by both sides.

### `2)` Host server

> Serve `createPtyHost` over a socket instead of `parentPort`.

1. `paths.ts`: socket path (`<userData>/pty-host.sock`, `\\.\pipe\sandy-pty-host-<user>` on Windows) and token file path, both passed as argv.
2. `server.ts`: create dir `0700`, listen, require a valid `hello` first, route requests to `createPtyHost`, fan events to every connected client; PTYs never depend on a client being connected.
3. `index.ts`: start the server from argv; keep `createPtyHost` exported for tests.

### `3)` Launcher and client

> The main process starts or finds the host and talks to it through the port.

1. `host-launcher.ts`: try to connect; on failure `spawn(process.execPath, [hostPath, ...], { detached: true, stdio: 'ignore', env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } }).unref()`, then retry until the socket answers.
2. `host-client.ts`: connection, handshake, request send, event dispatch.
3. `NodePtyTerminal`: replace `utilityProcess` with the client; keep `open/write/resize/close/onData/onExit/runningCount` behavior and the "only `open` starts the host" rule; on connection loss reject pending opens and report running sessions as exited.
4. `main.ts`: pass `userData` paths; `before-quit` still stops sessions in this phase (behavior unchanged until phase 3).

### `4)` Host lifecycle

> No orphan.

1. Server exits 30 s after holding no session and no client; exits on `shutdown`; removes the socket and token files on exit.
2. A stale socket file (host dead) is replaced by the launcher.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | Messages round-trip, including a message split across chunks and several in one chunk |
| 2 | A wrong token gets `hello-refused`; a valid client drives a PTY end to end; the PTY survives a client disconnect |
| 3 | `pnpm dev` opens a session that behaves as before; killing the app leaves the host alive (manual) |
| 4 | An idle host exits after 30 s with no client; no socket file remains; a stale socket is replaced |
