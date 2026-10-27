import { useEffect, useState } from 'react';

export interface LaunchRequest {
  agent: string;
  projectPath: string;
}

export function LaunchSession({ onLaunch, error }: { onLaunch: (request: LaunchRequest) => Promise<void>; error?: string }) {
  const { session } = window.sandy;
  const [agents, setAgents] = useState<string[]>([]);
  const [agent, setAgent] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    void session.listAgents().then((list) => {
      setAgents(list);
      setAgent((current) => current || (list[0] ?? ''));
    });
  }, [session]);

  async function pickProject(): Promise<void> {
    const path = await session.pickProject();
    if (path) setProjectPath(path);
  }

  async function launch(): Promise<void> {
    setLaunching(true);
    try {
      await onLaunch({ agent, projectPath });
    } finally {
      setLaunching(false);
    }
  }

  return (
    <form
      className="launch"
      onSubmit={(event) => {
        event.preventDefault();
        void launch();
      }}
    >
      <h1>Nouvelle session</h1>
      <label htmlFor="project">Projet</label>
      <input id="project" value={projectPath} readOnly placeholder="Aucun dossier choisi" />
      <button type="button" onClick={() => void pickProject()}>
        Choisir
      </button>
      <label htmlFor="agent">Agent</label>
      <select id="agent" value={agent} onChange={(event) => setAgent(event.target.value)}>
        {agents.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </select>
      <button type="submit" className="primary" disabled={!projectPath || !agent || launching}>
        Lancer
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
