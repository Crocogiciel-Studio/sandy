import type { TerminalSession } from '../terminal/Terminal';
import type { Activity } from '../terminal/session-activity';

export interface OpenSession {
  // Agent name, kept until the agent publishes a title.
  label: string;
  // Name the agent gave the session through its terminal title.
  title?: string;
  projectPath: string;
  session: TerminalSession;
  exitCode?: number;
  // Only agents with hooks report one; the others stay `undefined`.
  activity?: Activity;
}

export const displayName = (one: OpenSession): string => one.title ?? one.label;
export const isProvisional = (one: OpenSession): boolean => one.title === undefined;
export const PROVISIONAL_HINT = "Nom provisoire : l'agent n'a pas encore nommé cette session";

export type SessionState = Activity | 'running' | 'ended';

export const sessionState = (one: OpenSession): SessionState => (one.exitCode !== undefined ? 'ended' : (one.activity ?? 'running'));

export const STATE_TEXT: Record<SessionState, (one: OpenSession) => string> = {
  working: () => 'travaille',
  waiting: () => 'à vous',
  attention: () => 'autorisation',
  running: () => '',
  ended: (one) => `terminée (${one.exitCode})`,
};
