import type { SessionState } from '../sessions/session-state';

export interface Notice {
  title: string;
  body: string;
}

const BODY: Partial<Record<SessionState, (exitCode?: number) => string>> = {
  waiting: () => 'Your turn',
  attention: () => 'Needs your permission',
  ended: (exitCode) => `Ended (${exitCode})`,
};

// A change into a state that needs the user, unless the user is already looking at the session.
export function noticeFor(change: { previous: SessionState; next: SessionState; looking: boolean; name: string; exitCode?: number }): Notice | undefined {
  const { previous, next, looking, name, exitCode } = change;
  if (looking || previous === next || previous === 'ended') return undefined;
  const body = BODY[next]?.(exitCode);
  return body === undefined ? undefined : { title: name, body };
}
