import type { SandboxSummary } from '../../../contracts/api';
import type { Project } from './projects';
import { PROVISIONAL_HINT, STATE_TEXT, displayName, isProvisional, sessionState, type OpenSession } from './session-state';
import type { Sandboxes } from './use-sandboxes';

interface Props {
  project: Project;
  sandboxes: Sandboxes;
  active: string;
  onSelect: (id: string) => void;
  onClose: (session: OpenSession) => void;
  onAttach: (sandbox: SandboxSummary) => Promise<void>;
  onNewSandbox: (projectPath: string) => void;
}

export function ProjectPage({ project, sandboxes, active, onSelect, onClose, onAttach, onNewSandbox }: Props) {
  const { busy, refresh, stop, remove, whileBusy } = sandboxes;
  return (
    <section className="project-page">
      <h1 title={project.path || undefined}>{project.name}</h1>
      <h2>Running sessions</h2>
      {project.sessions.length === 0 && <p className="empty">No open sessions.</p>}
      <ul>
        {project.sessions.map((one) => {
          const state = sessionState(one);
          return (
            <li key={one.session.id} className="row">
              <button type="button" className="row-main" aria-current={active === one.session.id} onClick={() => onSelect(one.session.id)}>
                <span className="dot" data-state={state} aria-hidden="true" />
                <span className="row-label session-name" data-provisional={isProvisional(one) || undefined} title={isProvisional(one) ? PROVISIONAL_HINT : displayName(one)}>
                        {displayName(one)}
                      </span>
                <span className="row-state" data-state={state}>
                  {STATE_TEXT[state](one)}
                </span>
              </button>
              <span className="actions">
                <button type="button" aria-label={`Close ${displayName(one)}`} onClick={() => onClose(one)}>
                  Close
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <h2>
        Sandboxes
        <button type="button" className="quiet" onClick={() => void refresh()}>
          Refresh
        </button>
      </h2>
      {project.sandboxes.length === 0 && <p className="empty">No sandbox for this project.</p>}
      <ul>
        {project.sandboxes.map((sandbox) => (
          <li key={sandbox.name} className="row">
            <button
              type="button"
              className="row-main"
              title={sandbox.workspaces.join('\n') || sandbox.name}
              disabled={busy !== undefined || sandbox.workspaces.length === 0}
              onClick={() => void whileBusy(sandbox, () => onAttach(sandbox))}
            >
              <span className="dot" data-state={sandbox.status === 'running' ? 'idle' : 'ended'} aria-hidden="true" />
              <span className="row-label">{sandbox.name}</span>
              <span className="row-state">{sandbox.agent}</span>
            </button>
            <span className="actions">
              <button type="button" disabled={busy !== undefined || sandbox.workspaces.length === 0} onClick={() => void whileBusy(sandbox, () => onAttach(sandbox))}>
                New session
              </button>
              <button type="button" disabled={busy !== undefined || sandbox.status !== 'running'} onClick={() => void stop(sandbox)}>
                Stop
              </button>
              <button type="button" disabled={busy !== undefined} onClick={() => void remove(sandbox)}>
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
      {project.path && (
        <button type="button" className="project-new" onClick={() => onNewSandbox(project.path)}>
          New sandbox
        </button>
      )}
    </section>
  );
}
