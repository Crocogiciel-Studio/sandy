---
status: done
---

# Instruction: notify decision (renderer)

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── src/ui/app/App.tsx                                      ✏️
├── src/ui/features/terminal/notify-transition.ts           ✅
└── src/ui/features/terminal/notify-transition.test.ts      ✅
```

## Test Scope

| Scenario   | Action | Observable outcome | Actor |
| ---------- | ------ | ------------------ | ----- |
| Setup      | Window hidden or unfocused, session in `working` | ready state | system |
| Happy path | Activity moves to `waiting` | one notification request | system |
| Edge case  | Activity moves to `attention` | one notification request | system |
| Edge case  | Exit event on a session with no hooks | one notification request | system |
| Edge case  | Same activity reported twice in a row | no second request | system |
| Edge case  | Window focused and the session is the active one | no request | system |
| Edge case  | Screen restored after relaunch | no request | system |
| Edge case  | Session closed by the user | no request | system |

## Tasks to do

### `1)` Decide when to notify

> A pure function answers whether a change of state deserves a notification.

1. Create `notify-transition.ts`: given previous state, next state and whether the user is looking at the session, return the notification text or `undefined`.
2. Notify only on a change into `waiting`, `attention` or ended; never on `working`, never when the state is unchanged.
3. "Looking" means window focused and session active.
4. Write `notify-transition.test.ts` for every row of the test scope.

### `2)` Call it from the session callbacks

> Wire the decision to activity and exit events.

1. In `App.tsx` `open()`, compare each activity and exit event with the session's previous state and call `window.sandy.notify` when the function returns text.
2. No skip for restored sessions: the serialize addon emits no OSC, so a replay never reports an activity.
3. Read the active session and window focus at event time, not at render time.

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | The function returns text only for a change into `waiting`, `attention` or ended while the user is not looking |
| 2 | A background session turning `waiting` sends one request; a repeat or a restored session sends none |
