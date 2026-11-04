import type { TerminalSession } from '../terminal/Terminal';
import type { Activity } from '../terminal/session-activity';

export interface OpenSession {
  label: string;
  projectPath: string;
  session: TerminalSession;
  exitCode?: number;
  // Only agents with hooks report one; the others stay `undefined`.
  activity?: Activity;
}

export type SessionState = Activity | 'running' | 'ended';

export const sessionState = (one: OpenSession): SessionState => (one.exitCode !== undefined ? 'ended' : (one.activity ?? 'running'));

export const STATE_TEXT: Record<SessionState, (one: OpenSession) => string> = {
  working: () => 'travaille',
  waiting: () => 'à vous',
  attention: () => 'autorisation',
  running: () => '',
  ended: (one) => `terminée (${one.exitCode})`,
};
