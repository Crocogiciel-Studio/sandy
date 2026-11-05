---
objective: "A system notification fires once when a session turns waiting, needs attention or ends while the user is not looking at it, and clicking it opens that session."
status: implemented
---

# Plan: notify when a background agent waits or finishes

Source: GitHub issue #77

## Phases

| #   | Phase                    | File                         | Depends on |
| --- | ------------------------ | ---------------------------- | ---------- |
| 1   | Notify decision (renderer) | [`phase-1.md`](./phase-1.md) | none |
| 2   | Show and focus (shell)     | [`phase-2.md`](./phase-2.md) | 1 |

## External sources

| URL | What it settled |
| --- | --------------- |
| none | none |

## Impact

| Category | Verdict and evidence | Handled in |
| -------- | -------------------- | ---------- |
| Runtime | Electron `Notification` on macOS, Windows and Linux: unverified. The renderer survives window hide (`main.ts` hides on close), so it keeps receiving OSC activity | 2 |
| Runtime | Replayed screens after relaunch probably hold no activity OSC (serialize addon): unverified. The OSC handler is armed before the replay is written, so a replayed OSC would notify; the first event of a restored session is ignored as a safeguard | 1 |
| Regression | Touches `App.tsx` `open()` callbacks and the preload API; covered by `session-activity.test.ts` and `projects.test.ts`; risk low; safety net no | 1, 2 |
| Regression | Sandbox stop/remove closes sessions from the main process, so their exit looks like an agent finishing and notifies when the user is elsewhere: accepted limitation, unverified: whether a stop emits `terminal:exit` | 1 |
| Architecture | Decision stays in the renderer (it alone knows the active session and focus); main only displays and routes the click. `core` untouched | 2 |
| Documentation | `aidd_docs/memory/desktop.md` (notifications, click behavior) | 2 |

## Rules

| Rule | Why it applies |
| ---- | -------------- |
| English UI only (`design.md`) | notification title and body |
| `core` imports nothing (`architecture.md`) | notification code lives in shell and ui |
| `pnpm typecheck`, `pnpm lint`, then `pnpm test`, `pnpm build` (`coding-assertions.md`) | validation |

## Decisions

| Decision | Why |
| -------- | --- |
| The renderer decides whether to notify; main only shows the notification | focus and active session are renderer state, no new state to sync |
