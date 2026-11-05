---
status: done
---

# Instruction: show and focus (shell)

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── src/contracts/api.ts                         ✏️
├── src/shell/electron/ipc/notification.ts       ✅
├── src/shell/electron/main.ts                   ✏️
├── src/shell/electron/preload/index.ts          ✏️
├── src/ui/app/App.tsx                           ✏️
└── aidd_docs/memory/desktop.md                  ✏️
```

## Test Scope

| Scenario   | Action | Observable outcome | Actor |
| ---------- | ------ | ------------------ | ----- |
| Setup      | Two sessions, window hidden | ready state | browser |
| Happy path | Agent in session B turns `waiting` | system notification names session B | system |
| Happy path | Click the notification | window shows with session B active | system |
| Edge case  | Request with an unknown session id or non-string text | nothing shown | system |
| Edge case  | Notifications unsupported (`Notification.isSupported()` false) | nothing shown, no error | system |
| Edge case  | Click after the session was closed | window shows, no crash | system |

## Tasks to do

### `1)` Notify API

> Expose one narrow call to the renderer and one event back.

1. In `contracts/api.ts`, add `notify(id, title, body)` and `onOpenSession(listener)` to `SandyApi`.
2. Expose both in `preload/index.ts`.

### `2)` Show and route the click

> Main displays the notification and brings the session back.

1. Create `ipc/notification.ts`: validate the arguments, return if unsupported, show an Electron `Notification`.
2. On click, show the window and send `session:open` with the id.
3. Register it from `main.ts`.

### `3)` Open the session on click

> The renderer selects the session it is told about.

1. In `App.tsx`, subscribe to `onOpenSession` and set that session active if it is still open.

### `4)` Document

> Keep the memory in sync.

1. Add a Notifications section to `desktop.md`: trigger states, no notification while looking, click behavior, sandbox-stop limitation.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | The renderer can send a notification and receive an open-session event |
| 2 | Malformed input shows nothing; a click shows the window |
| 3 | The clicked session becomes active; a closed one is ignored |
| 4 | `desktop.md` describes the behavior |
