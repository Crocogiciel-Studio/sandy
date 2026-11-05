---
status: pending
---

# Instruction: policy log contract and sbx adapter

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
src/core/ports/sandbox-provider.ts                    ✏️
src/core/domain/blocked-domain.ts                      ✅
src/core/domain/blocked-domain.test.ts                 ✅
src/adapters/sandbox/sbx/sbx-policy-log.ts             ✅
src/adapters/sandbox/sbx/sbx-policy-log.test.ts        ✅
src/adapters/sandbox/sbx/__fixtures__/policy-log.json  ✅
src/adapters/sandbox/sbx/sbx-sandbox-provider.ts       ✏️
src/adapters/sandbox/sbx/sbx-sandbox-provider.test.ts  ✏️
```

## Test Scope

| Scenario   | Action | Observable outcome | Actor |
| ---------- | ------ | ------------------ | ----- |
| Setup      | Fixture trimmed from a real `sbx policy log NAME --json` capture with at least one blocked and one allowed host | Fixture committed | cli |
| Happy path | Parse the fixture | Blocked hosts are returned once each, allowed ones dropped | system |
| Edge case  | Unreadable JSON, non-array, entry missing its host | Throws a clear error; incomplete entries dropped | system |
| Edge case  | Host that is a wildcard, contains whitespace or starts with `-` | Rejected by the domain validator | system |
| Happy path | Provider `allowHost` | Runs `policy allow network --sandbox NAME HOST` exactly | system |
| Teardown   | none | none | system |

## Tasks to do

### `1)` Fixture from the real capture

> The parser is written against reality, not a guess.

1. Trim the user's Mac capture of `sbx policy log claude-sandy --json` into `__fixtures__/policy-log.json` (blocked, allowed, entries with and without `rule`).

### `2)` Domain validator

> One exact hostname or nothing.

1. In `blocked-domain.ts`, export `isAllowableHost(host)`: hostname of letters, digits, dots and hyphens, optional `:port`, no leading `-`, no `*`, no `/`.
2. Test valid and invalid hosts.

### `3)` Parser

> Read only the fields sandy needs.

1. `parsePolicyLog(json)` returns `{ allowed, blocked }` as `{ host, lastSeen }`, following the tolerant style of `parseSandboxList`.
2. Contract test against the fixture.

### `4)` Port and provider

> Expose the two operations through the port.

1. Add `policyLog(name): Promise<PolicyLog>` and `allowHost(request: { name: string; host: string }): Promise<void>` to `SandboxProvider`.
2. Implement in `SbxSandboxProvider`: `policy log NAME --json --limit 500` and `policy allow network --sandbox NAME DOMAIN`.
3. Extend the provider test with the recorded `run` arguments.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | A real capture is committed as a fixture. |
| 2 | `*`, `*.x.com`, `a b`, `-x`, `x.com/path` are rejected; `x.com:443`; `registry.npmjs.org` accepted. |
| 3 | The fixture yields the expected blocked and allowed hosts with epoch `lastSeen`. |
| 4 | `allowHost` calls `sbx` with `--sandbox` and the exact host, never without `--sandbox`. |
