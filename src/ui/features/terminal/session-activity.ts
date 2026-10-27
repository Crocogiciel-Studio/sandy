export type Activity = 'working' | 'waiting';

// Output means the agent is working; a quiet stretch means it waits for the user.
// Calls `onChange` only when the activity actually flips.
export function createActivityTracker(onChange: (activity: Activity) => void, idleMs = 2000) {
  let current: Activity | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const set = (next: Activity): void => {
    if (next === current) return;
    current = next;
    onChange(next);
  };
  return {
    touch(): void {
      set('working');
      clearTimeout(timer);
      timer = setTimeout(() => set('waiting'), idleMs);
    },
    stop(): void {
      clearTimeout(timer);
    },
  };
}
