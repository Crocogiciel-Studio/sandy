import { execFile } from 'node:child_process';
import { delimiter } from 'node:path';
import type { SandboxProvider, SessionCommand } from '../../../core/ports/sandbox-provider';
import { searchDirs } from '../../../pty-host/search-dirs';

// Built-in agents listed by `sbx run --help` (v0.49.2); sbx exposes no JSON list.
const AGENTS = ['claude', 'codex', 'cursor', 'devin', 'docker-agent', 'gemini', 'opencode', 'shell'] as const;
const COPY_TIMEOUT_MS = 60_000;

export type RunSbx = (args: string[]) => Promise<void>;

// `sbx cp` has no --json: success is its exit code.
const runSbx: RunSbx = (args) =>
  new Promise((resolve, reject) => {
    // Windows spells the key `Path`: overwrite it rather than adding a second one.
    const pathKey = Object.keys(process.env).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH';
    const env = { ...process.env, [pathKey]: searchDirs().join(delimiter) };
    execFile('sbx', args, { env, timeout: COPY_TIMEOUT_MS }, (error, _stdout, stderr) => {
      if (!error) return resolve();
      const reason = stderr.trim().split('\n').pop() || error.message;
      reject(new Error(`sbx ${args[0]} a échoué : ${reason}`));
    });
  });

export class SbxSandboxProvider implements SandboxProvider {
  constructor(private readonly run: RunSbx = runSbx) {}

  listAgents(): readonly string[] {
    return AGENTS;
  }

  sessionCommand({ agent, projectPath, name }: { agent: string; projectPath: string; name: string }): SessionCommand {
    return { command: 'sbx', args: ['run', agent, projectPath, '--name', name] };
  }

  copyIn({ sandboxName, hostPath, sandboxPath }: { sandboxName: string; hostPath: string; sandboxPath: string }): Promise<void> {
    return this.run(['cp', hostPath, `${sandboxName}:${sandboxPath}`]);
  }
}
