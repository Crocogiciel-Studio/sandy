import { useEffect, useState } from 'react';
import type { SandboxSummary } from '../../../contracts/api';
import { projectState, projectViewId, type Project } from './projects';
import { PROVISIONAL_HINT, STATE_TEXT, displayName, isProvisional, sessionState, type OpenSession } from './session-state';

interface Props {
  // Docker sign-in is confirmed; unknown shows nothing rather than a doubtful claim.
  signedIn: boolean;
  projects: Project[];
  // `sbx ls` failed: the sandbox-only projects are missing, so say so wherever the user is.
  error?: string;
  active: string;
  newSessionId: string;
  onSelect: (id: string) => void;
  onClose: (session: OpenSession) => void;
  onNewSandbox: (projectPath: string) => void;
  // New session in an existing sandbox.
  onAttach: (sandbox: SandboxSummary) => void;
  busy?: string;
}

const attachable = (project: Project): SandboxSummary[] => project.sandboxes.filter((sandbox) => sandbox.workspaces.length > 0);

export function Sidebar({ signedIn, projects, error, active, newSessionId, onSelect, onClose, onNewSandbox, onAttach, busy }: Props) {
  // Project whose sandbox choice is open.
  const [choosing, setChoosing] = useState<string>();
  useEffect(() => {
    if (choosing === undefined) return;
    const close = (): void => setChoosing(undefined);
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [choosing]);
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string): void =>
    setFolded((all) => {
      const next = new Set(all);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  return (
    <nav className="sidebar" aria-label="Projects">
      <button type="button" className="new-session" aria-current={active === newSessionId} onClick={() => onSelect(newSessionId)}>
        New sandbox
      </button>
      {projects.map((project) => {
        const viewId = projectViewId(project.path);
        const isFolded = folded.has(viewId);
        return (
          <section key={viewId} className="group">
            <div className="project-row">
              <button
                type="button"
                className="fold"
                aria-expanded={!isFolded}
                aria-label={`${isFolded ? 'Expand' : 'Collapse'} ${project.name}`}
                onClick={() => toggle(viewId)}
              >
                <span className="chevron" aria-hidden="true" />
              </button>
              <button type="button" className="project" title={project.path || undefined} aria-current={active === viewId} onClick={() => onSelect(viewId)}>
                <span className="dot" data-state={projectState(project) ?? 'idle'} aria-hidden="true" />
                <span className="row-label">{project.name}</span>
                {isFolded && project.sessions.length > 0 && <span className="count">{project.sessions.length}</span>}
              </button>
              {project.path && (
                <button
                  type="button"
                  className="project-add"
                  aria-label={`New session in ${project.name}`}
                  aria-haspopup={attachable(project).length > 1 ? 'menu' : undefined}
                  aria-expanded={choosing === viewId}
                  title="New session"
                  disabled={busy !== undefined}
                  onClick={(event) => {
                    const choices = attachable(project);
                    const [only, second] = choices;
                    if (!only) return onNewSandbox(project.path);
                    if (!second) return onAttach(only);
                    event.stopPropagation();
                    setChoosing(choosing === viewId ? undefined : viewId);
                  }}
                >
                  +
                </button>
              )}
              {choosing === viewId && (
                <ul className="choice" role="menu" aria-label={`Sandboxes of ${project.name}`}>
                  {attachable(project).map((sandbox) => (
                    <li key={sandbox.name} role="none">
                      <button type="button" role="menuitem" autoFocus={sandbox === attachable(project)[0]} onClick={() => onAttach(sandbox)}>
                        <span className="row-label">{sandbox.name}</span>
                        <span className="row-state">{sandbox.agent}</span>
                      </button>
                    </li>
                  ))}
                  <li role="none">
                    <button type="button" role="menuitem" onClick={() => onNewSandbox(project.path)}>
                      New sandbox
                    </button>
                  </li>
                </ul>
              )}
            </div>
            {!isFolded && (
            <ul className="sessions">
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
            )}
          </section>
        );
      })}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {signedIn && <p className="account quiet">Signed in to Docker</p>}
    </nav>
  );
}
