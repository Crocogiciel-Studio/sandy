import type { SandboxProvider, SessionCommand } from '../../../core/ports/sandbox-provider';

// Built-in agents listed by `sbx run --help` (v0.49.2); sbx exposes no JSON list.
const AGENTS = ['claude', 'codex', 'cursor', 'devin', 'docker-agent', 'gemini', 'opencode', 'shell'] as const;

export class SbxSandboxProvider implements SandboxProvider {
  listAgents(): readonly string[] {
    return AGENTS;
  }

  sessionCommand({ agent, projectPath, name }: { agent: string; projectPath: string; name: string }): SessionCommand {
    return { command: 'sbx', args: ['run', agent, projectPath, '--name', name] };
  }
}
