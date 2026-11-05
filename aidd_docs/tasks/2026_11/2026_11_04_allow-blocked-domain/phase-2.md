---
status: pending
---

# Instruction: use cases to list and allow blocked domains

## Architecture projection

```txt
src/core/use-cases/blocked-domains.ts       ✅
src/core/use-cases/blocked-domains.test.ts  ✅
src/core/use-cases/manage-sandbox.test.ts   ✏️
src/core/use-cases/attach-session.test.ts   ✏️
src/core/use-cases/start-session.test.ts    ✏️
src/core/use-cases/drop-files.test.ts       ✏️
```

## Test Scope

| Scenario   | Action | Observable outcome | Actor |
| ---------- | ------ | ------------------ | ----- |
| Setup      | In-memory provider listing one sandbox and one blocked host | Ready | system |
| Happy path | `listBlockedHosts` | Returns the blocked host | system |
| Happy path | `allowBlockedHost` with that host | Provider receives the sandbox name and host | system |
| Edge case  | Host not currently blocked, or invalid | Rejects, provider never asked to allow | system |
| Edge case  | Unknown or option-like sandbox | Rejects like `findSandbox` | system |
| Teardown   | none | none | system |

## Tasks to do

### `1)` List use case

> Blocked hosts of one sandbox.

1. `listBlockedHosts(sandbox, name, since)`: `findSandbox`, `policyLog(name)`, then keep blocked hosts with `lastSeen` after `since` and no newer allowed entry for the same host.

### `2)` Allow use case

> Allow only what is blocked right now.

1. `allowBlockedHost(sandbox, { name, host, since })`: validate with `isAllowableHost`, check the host is in `listBlockedHosts`, then `allowHost`.

### `3)` Fakes

> Keep the suite compiling.

1. Add the two methods to the four fakes typed `SandboxProvider`.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | Returns the provider's blocked hosts for a listed sandbox. |
| 2 | An unblocked, wildcard or invalid host never reaches `allowHost`. |
| 3 | `pnpm typecheck` and `pnpm test` pass. |
