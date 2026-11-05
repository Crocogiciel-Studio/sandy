---
objective: "A domain blocked for a running session shows a banner in that session, and one click allows it for that sandbox only."
status: done
---

# Plan: allow a blocked domain from the session

Source: GitHub issue #75

## Phases

| #   | Phase                                   | File                         | Depends on |
| --- | --------------------------------------- | ---------------------------- | ---------- |
| 1   | Policy log contract and sbx adapter      | [`phase-1.md`](./phase-1.md) | none |
| 2   | Use cases: list and allow blocked domains | [`phase-2.md`](./phase-2.md) | 1 |
| 3   | IPC, preload and API contract            | [`phase-3.md`](./phase-3.md) | 2 |
| 4   | Banner, polling and docs                 | [`phase-4.md`](./phase-4.md) | 3 |

## External sources

| URL | What it settled |
| --- | --------------- |
| https://github.com/docker/sbx-releases/releases/tag/v0.51.0 (`sbx policy allow network --help`) | `--sandbox SANDBOX` scopes the rule to one sandbox; without it the rule is global. `--no-input` exists. A rule opposite to an existing one in the same scope is refused. |
| https://github.com/docker/sbx-releases/releases/tag/v0.51.0 (`sbx policy log --help`) | `sbx policy log [SANDBOX] --json --limit N`; entries carry host, rule, proxy type, request count. Field names come from the Mac capture. |

## Impact

| Category | Verdict and evidence | Handled in |
| -------- | -------------------- | ---------- |
| runtime | `--sandbox` scoping is documented in the v0.51.0 help but unverified on a real sandbox. `policy log NAME --json` captured on the user's Mac (v0.51.0): `{allowed: [], blocked: []}`, entries `{sandbox_id, host: "name:port", proxy_type, rule?, reason?, count, first_seen, last_seen}` with ISO timestamps; lists are cumulative history (observed), `--limit` applies per list (observed). | 1 |
| regression | Adds two methods to `SandboxProvider`: the four fakes typed `SandboxProvider` must implement them (`manage-sandbox.test.ts`, `attach-session.test.ts`, `start-session.test.ts`, `drop-files.test.ts`); `start-sign-in.test.ts` and `check-sbx.test.ts` use partial objects and need no change. Whether `main.ts` builds a provider object is unchecked. Risk low. No safety-net phase: type errors flag each fake. | 1, 2 |
| architecture | Follows ports and adapters: new methods on the existing `SandboxProvider` port, parsing in `src/adapters/sandbox/sbx`, `core` stays free of Electron and Node. Polling lives in the renderer; main only answers two IPC calls. | 1, 2, 3, 4 |
| documentation | `aidd_docs/memory/design.md` (banner component), `aidd_docs/memory/codebase-map.md` unchanged. | 4 |

## Rules

| Rule | Why it applies |
| ---- | -------------- |
| `sbx` is the single source of truth, no durable cache (architecture.md) | Blocked domains are re-read from `policy log` on each poll; only "kept blocked" choices live in renderer memory. |
| Contract tests freeze undocumented sbx JSON (architecture.md) | `policy log --json` parser gets a fixture captured from a real sbx. |
| `core` imports nothing (architecture.md) | Domain validation and use cases stay pure TS. |
| UI in English only, no inline styles, colors via `var(--...)` (design.md) | The issue's French copy is translated; banner styled in `app.css` with `--attention`. |
| Pre-commit `pnpm typecheck` and `pnpm lint`; pre-push `pnpm test` and `pnpm build` (coding-assertions.md) | Gate each phase. |

## Decisions

| Decision | Why |
| -------- | --- |
| The renderer sends a session id and a domain; main allows it only if `policy log` currently reports it blocked for that session's sandbox | A compromised renderer cannot create arbitrary rules, and no global or wildcard path exists. |
| Rule always created with `--sandbox NAME`, one exact `host:port` as sbx reported it per call | Acceptance criterion: no path in the UI allows globally; the port keeps the rule as narrow as the block. |
| A block shows only if `last_seen` is after the session opened and no allowed entry for the same host is newer | `blocked` is cumulative history, so old blocks (startup noise) must not resurface. |
