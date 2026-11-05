---
status: pending
---

# Instruction: tray to reopen on Windows and Linux

## Architecture projection

```txt
src/shell/electron/
├── main.ts   ✏️
└── tray.ts   ✅
```

## Test Scope

| Scenario | Action | Observable outcome | Actor |
| -------- | ------ | ------------------ | ----- |
| Setup | Start a session on Windows or Linux | Tray icon present | browser |
| Happy path | Close the window, click the tray icon | Window returns with the sessions running | browser |
| Edge case | Tray menu "Quit" | Same confirmation as phase 1 | browser |
| Teardown | Quit | Tray icon removed | system |

## Tasks to do

### `1)` Tray

> Without a Dock, a hidden window needs a way back.

1. Create `tray.ts`: `Tray` from `build/icon.png`, click and menu "Show Sandy" show the window, menu "Quit" calls `app.quit()`.
2. In `main.ts`, on non-darwin create the tray once; `window-all-closed` no longer quits (the window is hidden, not closed) except through quit.
3. Make sure `build/icon.png` is available in packaged builds (check `electron-builder` config `files`/`extraResources`).

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | Closing the window on Windows/Linux keeps sessions alive and the tray reopens the same window; Quit goes through the confirmation |
