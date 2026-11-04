import './app.css';
import { useEffect, useState } from 'react';
import type { SandboxSummary, StartSessionResult } from '../../contracts/api';
import { LaunchSession, type LaunchRequest } from '../features/sessions/LaunchSession';
import { ProjectPage } from '../features/sessions/ProjectPage';
import { buildProjects, projectViewId } from '../features/sessions/projects';
import { parseTitle } from '../features/terminal/session-title';
import { STATE_TEXT, displayName, isProvisional, sessionState, type OpenSession } from '../features/sessions/session-state';
import { Sidebar } from '../features/sessions/Sidebar';
import { useSandboxes } from '../features/sessions/use-sandboxes';
import { SbxSetup } from '../features/onboarding/SbxSetup';
import { SignInSetup } from '../features/onboarding/SignInSetup';
import { useSbxStatus } from '../features/onboarding/use-sbx-status';
import { useSignIn } from '../features/onboarding/use-sign-in';
import { openTerminal, Terminal } from '../features/terminal/Terminal';

const NEW = 'new';

// Nothing else works without a usable, signed-in sbx: a setup screen stands in until it is.
export function App() {
  const sbx = useSbxStatus();
  const signIn = useSignIn(sbx.status?.status === 'ok');
  if (!sbx.status) return null;
  if (sbx.status.status !== 'ok') return <SbxSetup status={sbx.status} checking={sbx.checking} onRecheck={sbx.recheck} />;
  if (!signIn.state) return null;
  if (signIn.state === 'signed-out') return <SignInSetup checking={signIn.checking} onRecheck={signIn.recheck} />;
  return <Sessions signedIn={signIn.state === 'signed-in'} />;
}

function Sessions({ signedIn }: { signedIn: boolean }) {
  const [running, setRunning] = useState<OpenSession[]>([]);
  const [active, setActive] = useState<string>(NEW);
  const [error, setError] = useState<string>();
  // Folder the new-session form starts with, when it was opened from a project's page.
  const [launchPath, setLaunchPath] = useState<string>();
  const sandboxes = useSandboxes();
  const { refresh } = sandboxes;

  async function open(
    agent: string,
    projectPath: string,
    start: (cols: number, rows: number) => Promise<StartSessionResult>,
  ): Promise<void> {
    setError(undefined);
    const result = await openTerminal(start, (id, exitCode) => {
      setRunning((all) => all.map((one) => (one.session.id === id ? { ...one, exitCode } : one)));
      void refresh(true);
    },
    (id, activity) => setRunning((all) => all.map((one) => (one.session.id === id ? { ...one, activity } : one))),
    (id, raw) => {
      const title = parseTitle(raw, agent);
      if (title) setRunning((all) => all.map((one) => (one.session.id === id ? { ...one, title } : one)));
    },
    );
    if (!result.ok) return setError(result.message);
    // Two sessions of the same agent on the same project must stay tellable apart.
    setRunning((all) => {
      const base = agent;
      const same = all.filter((one) => one.projectPath === projectPath && (one.label === base || one.label.startsWith(`${base} (`))).length;
      return [...all, { label: same ? `${base} (${same + 1})` : base, projectPath, session: result.session }];
    });
    setLaunchPath(undefined);
    setActive(result.session.id);
    void refresh(true);
  }

  const launch = ({ agent, projectPath }: LaunchRequest): Promise<void> =>
    open(agent, projectPath, (cols, rows) => window.sandy.session.start({ agent, projectPath, cols, rows }));

  const attach = ({ name, agent, workspaces }: SandboxSummary): Promise<void> =>
    open(agent, workspaces[0] ?? name, (cols, rows) => window.sandy.session.attach({ name, cols, rows }));

  function close(one: OpenSession): void {
    window.sandy.terminal.close(one.session.id);
    one.session.dispose();
    const remaining = running.filter((other) => other !== one);
    setRunning(remaining);
    if (active === one.session.id) setActive(remaining.at(-1)?.session.id ?? NEW);
  }

  function select(id: string): void {
    if (id === NEW) setError(undefined);
    setLaunchPath(undefined);
    setActive(id);
  }

  function newSandboxOn(projectPath: string): void {
    setError(undefined);
    setLaunchPath(projectPath);
    setActive(NEW);
  }

  const projects = buildProjects(sandboxes.sandboxes, running);
  const page = projects.find((project) => projectViewId(project.path) === active);
  // A project page whose project is gone (last sandbox removed) falls back to the new-session form.
  const orphanPage = active.startsWith('project:') && !page;
  useEffect(() => {
    if (orphanPage) setActive(NEW);
  }, [orphanPage]);

  return (
    <div className="app">
      <Sidebar signedIn={signedIn} projects={projects} error={sandboxes.error} active={active} newSessionId={NEW} onSelect={select} onClose={close} onNewSandbox={newSandboxOn} />
      <main className="main">
        {running.map((one) => (
          <Terminal
            key={one.session.id}
            session={one.session}
            visible={active === one.session.id}
            ended={one.exitCode !== undefined}
            title={displayName(one)}
            provisional={isProvisional(one)}
            projectPath={one.projectPath}
            state={sessionState(one)}
            stateText={STATE_TEXT[sessionState(one)](one)}
          />
        ))}
        {page && (
          <ProjectPage
            project={page}
            sandboxes={sandboxes}
            active={active}
            onSelect={select}
            onClose={close}
            onAttach={attach}
            onNewSandbox={newSandboxOn}
          />
        )}
        {active === NEW && <LaunchSession onLaunch={launch} error={error} initialProjectPath={launchPath} />}
      </main>
    </div>
  );
}
