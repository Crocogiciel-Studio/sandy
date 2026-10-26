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
      style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 8, alignItems: 'center', padding: 16 }}
      onSubmit={(event) => {
        event.preventDefault();
        void launch();
      }}
    >
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
      <span />
      <span />
      <span />
      <button type="submit" disabled={!projectPath || !agent || launching}>
        Lancer
      </button>
      {error && (
        <p role="alert" style={{ gridColumn: '1 / -1', color: '#c62828', margin: 0 }}>
          {error}
        </p>
      )}
    </form>
  );
}
