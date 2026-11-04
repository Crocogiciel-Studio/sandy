---
status: pending
---

# Instruction: IPC, preload and API contract

## Architecture projection

```txt
src/contracts/api.ts                  ✏️
src/shell/electron/ipc/session.ts     ✏️
src/shell/electron/preload/index.ts   ✏️
```

## Test Scope

| Scenario   | Action | Observable outcome | Actor |
| ---------- | ------ | ------------------ | ----- |
| Setup      | App running with one session | Session id known | browser |
| Happy path | `session.blockedHosts(id)` | `{ ok: true, hosts }` | browser |
| Happy path | `session.allowHost(id, host)` | `{ ok: true }` | browser |
| Edge case  | Unknown session id or non-string host | `{ ok: false, message: 'Invalid request.' }` | browser |
| Teardown   | none | none | browser |

## Tasks to do

### `1)` API contract

> Typed surface for the renderer.

1. Add `BlockedDomainsResult` and the two methods to `SessionApi`.

### `2)` IPC handlers

> Resolve the sandbox from the session, never from the renderer.

1. `session:blocked-domains` and `session:allow-domain` look up `sessions.get(id)` and call the use cases with `session.sandboxName`.
2. Errors return `{ ok: false, message }` like the existing handlers.

### `3)` Preload

> Expose the two calls.

1. Add both to `session` in `preload/index.ts`.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | `pnpm typecheck` passes. |
| 2 | An id absent from `sessions` is refused without calling `sbx`. |
| 3 | `window.sandy.session.blockedHosts` and `allowHost` exist. |
