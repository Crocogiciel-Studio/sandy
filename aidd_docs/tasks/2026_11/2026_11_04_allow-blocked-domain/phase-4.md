---
status: pending
---

# Instruction: banner, polling and docs

## Architecture projection

```txt
src/ui/features/terminal/use-blocked-domains.ts   ✅
src/ui/features/terminal/BlockedDomains.tsx       ✅
src/ui/features/terminal/blocked-domains.test.ts  ✅
src/ui/features/terminal/Terminal.tsx             ✏️
src/ui/app/app.css                                ✏️
aidd_docs/memory/design.md                        ✏️
```

## Test Scope

| Scenario   | Action | Observable outcome | Actor |
| ---------- | ------ | ------------------ | ----- |
| Setup      | Running session whose agent hits a blocked host | Host appears in `policy log` | cli |
| Happy path | Wait one poll | Banner shows under the header, "Keep blocked" focused | browser |
| Happy path | Click "Allow permanently <host>" | Banner disappears; `sbx policy ls NAME` shows a rule for that sandbox only | browser |
| Edge case  | Click "Keep blocked" | Banner hidden for that host until sandy restarts or the session closes | browser |
| Edge case  | Several blocked hosts | One row per host | browser |
| Edge case  | Session ended or hidden tab | No polling for ended sessions | browser |
| Teardown   | `sbx policy rm network --sandbox NAME --id RULE_ID` | Baseline restored | cli |

## Wireframe

```txt
┌──────────────────────────────────────────────┐
│ (1) ● session name   project   state          │
├──────────────────────────────────────────────┤
│ (2) registry.npmjs.org is blocked for this    │
│     sandbox. The agent tried to connect.      │
│     [Keep blocked]  [Allow permanently ...]   │
├──────────────────────────────────────────────┤
│ (3) Terminal                                  │
└──────────────────────────────────────────────┘
```

1. Header: unchanged.
2. Banner: non-modal, `--attention` border, one block per blocked host, detail line under the buttons.
3. Terminal: unchanged, keeps focus handling.

## Tasks to do

### `1)` Polling hook

> Detect blocks without a stream.

1. `useBlockedDomains(sessionId, active)` polls `session.blockedHosts` every 5 s while the session runs, stops when it ends or on unmount, and drops hosts the user chose to keep blocked.
2. Pure helper for the filtering, unit tested.

### `2)` Banner component

> Calm, one clear choice.

1. English copy: "**host** is blocked for this sandbox. The agent tried to connect to it.", "Keep blocked" (default focus), "Allow permanently host", detail "The agent will be able to send and receive data to this domain, with no time limit."
2. Allow calls `session.allowHost`, shows the error message on failure, refreshes on success.

### `3)` Mount and style

> Wire it under the header.

1. Render the banner in `Terminal.tsx` between header and screen.
2. Classes in `app.css` using `var(--attention)`, no inline styles.

### `4)` Docs

> Keep memory true.

1. Describe the banner in `aidd_docs/memory/design.md` Components.
2. Hand over the manual checklist: block, allow, `sbx policy ls NAME`, confirm no global rule.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | Polling stops for an ended session; kept-blocked hosts do not return. |
| 2 | Allow never offers a wildcard or a global option; failure shows an error. |
| 3 | `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` pass. |
| 4 | `design.md` mentions the banner. |
