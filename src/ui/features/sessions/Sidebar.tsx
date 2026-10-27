import type { SandboxSummary } from '../../../contracts/api';
import type { TerminalSession } from '../terminal/Terminal';
import type { Activity } from '../terminal/session-activity';
import { groupByProject } from './group-by-project';
import { SandboxList } from './SandboxList';

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
  running: () => 'en cours',
  ended: (one) => `terminée (${one.exitCode})`,
};

interface Props {
  sessions: OpenSession[];
  active: string;
  newSessionId: string;
  onSelect: (id: string) => void;
  onClose: (session: OpenSession) => void;
  onAttach: (sandbox: SandboxSummary) => Promise<void>;
}

export function Sidebar({ sessions, active, newSessionId, onSelect, onClose, onAttach }: Props) {
  return (
    <nav className="sidebar" aria-label="Sessions">
      <button type="button" className="new-session" aria-current={active === newSessionId} onClick={() => onSelect(newSessionId)}>
        Nouvelle session
      </button>
      {groupByProject(sessions).map((group) => (
        <section key={group.projectPath} className="group">
          <h2 title={group.projectPath}>{group.name}</h2>
          <ul>
            {group.items.map((one) => {
              const state = sessionState(one);
              return (
                <li key={one.session.id} className="row">
                  <button type="button" className="row-main" aria-current={active === one.session.id} onClick={() => onSelect(one.session.id)}>
                    <span className="dot" data-state={state} aria-hidden="true" />
                    <span className="row-label">{one.label}</span>
                    <span className="row-state" data-state={state}>
                      {STATE_TEXT[state](one)}
                    </span>
                  </button>
                  <span className="actions">
                    <button type="button" aria-label={`Fermer ${one.label}`} onClick={() => onClose(one)}>
                      Fermer
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <SandboxList onAttach={onAttach} />
    </nav>
  );
}
