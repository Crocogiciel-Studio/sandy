---
objective: "Closing sandy's window keeps every session running and visible on reopening; quitting asks first when sessions would stop."
status: pending
---

# Plan: keep sessions when the window closes

Source: GitHub issue #76

## Phases

| #   | Phase                              | File                         | Depends on |
| --- | ---------------------------------- | ---------------------------- | ---------- |
| 1   | Hide the window, confirm on quit   | [`phase-1.md`](./phase-1.md) | none |
| 2   | Tray to reopen on Windows and Linux | [`phase-2.md`](./phase-2.md) | 1 |

## External sources

| URL   | What it settled   |
| ----- | ----------------- |
| none | none |

## Impact

| Category | Verdict and evidence | Handled in |
| -------- | -------------------- | ---------- |
| Runtime | Electron `close` event can be cancelled and `window.hide()` keeps the renderer alive: unverified here (no display in the sandbox), to check on the Mac | phase 1 |
| Regression | `main.ts` has no test; `window.on('closed') → closeAll()` is the behavior being replaced; `terminal.dispose()` on `before-quit` still stops agents at quit; risk medium | phase 1 |
| Runtime | `use-blocked-hosts.ts` skips polling while `document.hidden`: the banner may lag up to 5 s after reopening (accepted). `getAllWindows()` still includes a hidden window, so terminal data keeps flowing (observed in `ipc/terminal.ts`). Timer throttling of a hidden renderer, fullscreen close and Windows shutdown with a cancelled `close`: unverified, to check on the Mac | phase 1 |
| Cost | A hidden renderer stays in memory: the buffer measurement of #76 is dropped with the buffer; memory to watch on a long session | none |
| Architecture | Shell-only change (`src/shell/electron`); no port, no core change | phase 1, 2 |
| Documentation | `aidd_docs/memory/desktop.md` documents the window/tray behavior; #76 text to update (hide instead of a screen buffer) | phase 1 |

## Rules

| Rule | Why it applies |
| ---- | -------------- |
| Interface in English only | the quit dialog and tray labels are UI text |
| `pnpm typecheck`, `pnpm lint` before commit; `pnpm test`, `pnpm build` before push | project assertions |
| No attribution metadata in commits and PRs | vcs.md |

## Decisions

| Decision | Why |
| -------- | --- |
| Hide the window instead of destroying it and replaying a screen buffer | The xterms and the React session list live in the renderer: keeping that renderer alive restores every screen, alternate-screen TUIs included, with no `xterm-headless` buffer, no protocol and no new dependency. The buffer in #76's "Piste" is only needed if the renderer is destroyed. #78 (quit sandy) cannot reuse it anyway: the pty-host dies with the app. |
