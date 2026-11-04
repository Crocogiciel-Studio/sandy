import { projectState, projectViewId, type Project } from './projects';
import { STATE_TEXT, sessionState, type OpenSession } from './session-state';

interface Props {
  // Docker sign-in is confirmed; unknown shows nothing rather than a doubtful claim.
  signedIn: boolean;
  projects: Project[];
  active: string;
  newSessionId: string;
  onSelect: (id: string) => void;
  onClose: (session: OpenSession) => void;
}

export function Sidebar({ signedIn, projects, active, newSessionId, onSelect, onClose }: Props) {
  return (
    <nav className="sidebar" aria-label="Projets">
      <button type="button" className="new-session" aria-current={active === newSessionId} onClick={() => onSelect(newSessionId)}>
        Nouvelle session
      </button>
      {projects.map((project) => {
        const viewId = projectViewId(project.path);
        return (
          <section key={viewId} className="group">
            <button type="button" className="project" title={project.path || undefined} aria-current={active === viewId} onClick={() => onSelect(viewId)}>
              <span className="dot" data-state={projectState(project) ?? 'idle'} aria-hidden="true" />
              <span className="row-label">{project.name}</span>
            </button>
            <ul>
              {project.sessions.map((one) => {
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
        );
      })}
      {signedIn && <p className="account quiet">Connecté à Docker</p>}
    </nav>
  );
}
