// What the agent reports through its hooks (see src/adapters/sandbox/sbx/agent-hooks.ts):
// working = busy, waiting = its turn is over, attention = it needs the user's approval.
export type Activity = 'working' | 'waiting' | 'attention';

// OSC number the hooks write to the terminal; the payload is the activity.
export const ACTIVITY_OSC = 9999;

export function parseActivity(payload: string): Activity | undefined {
  return payload === 'working' || payload === 'waiting' || payload === 'attention' ? payload : undefined;
}
