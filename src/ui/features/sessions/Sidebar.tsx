import { useState } from 'react';
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
}

export function Sidebar({ signedIn, projects, error, active, newSessionId, onSelect, onClose, onNewSandbox }: Props) {
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string): void =>
    setFolded((all) => {
      const next = new Set(all);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  return (
    <nav className="sidebar" aria-label="Projets">
      <button type="button" className="new-session" aria-current={active === newSessionId} onClick={() => onSelect(newSessionId)}>
        Nouvelle sandbox
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
                aria-label={`${isFolded ? 'Déplier' : 'Replier'} ${project.name}`}
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
                <button type="button" className="project-add" aria-label={`Nouvelle sandbox dans ${project.name}`} title="Nouvelle sandbox" onClick={() => onNewSandbox(project.path)}>
                  +
                </button>
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
                      <button type="button" aria-label={`Fermer ${displayName(one)}`} onClick={() => onClose(one)}>
                        Fermer
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
      {signedIn && <p className="account quiet">Connecté à Docker</p>}
    </nav>
  );
}
