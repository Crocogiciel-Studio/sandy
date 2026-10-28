import { execFile } from 'node:child_process';
import { delimiter } from 'node:path';
import type { SandboxInfo, SandboxProvider, SessionCommand, SignInState } from '../../../core/ports/sandbox-provider';
import { searchDirs } from '../../../pty-host/search-dirs';
import { agentArgs } from './agent-hooks';
import { parseSignIn } from './sbx-diagnose';
import { parseSandboxList } from './sbx-list';
import { parseSbxVersionOutput } from './sbx-version';

// Built-in agents listed by `sbx run --help` (latest observed); sbx exposes no JSON list.
const AGENTS = ['claude', 'codex', 'copilot', 'cursor', 'devin', 'docker-agent', 'droid', 'gemini', 'kiro', 'opencode', 'shell'] as const;
const SBX_TIMEOUT_MS = 60_000;

// Resolves with stdout.
export type RunSbx = (args: string[]) => Promise<string>;

// Actions without --json (`cp`) succeed or fail by exit code.
const runSbx: RunSbx = (args) =>
  new Promise((resolve, reject) => {
    // Windows spells the key `Path`: overwrite it rather than adding a second one.
    const pathKey = Object.keys(process.env).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH';
    const env = { ...process.env, [pathKey]: searchDirs().join(delimiter) };
    execFile('sbx', args, { env, timeout: SBX_TIMEOUT_MS }, (error, stdout, stderr) => {
      if (!error) return resolve(stdout);
      const reason = stderr.trim().split('\n').pop() || error.message;
      // The code survives so a missing binary (ENOENT) can be told apart from a failing one.
      // `stdout` too, in case `diagnose` exits non-zero when a check fails (not observed yet) but still prints its report.
      reject(Object.assign(new Error(`sbx ${args[0]} a échoué : ${reason}`), { code: (error as NodeJS.ErrnoException).code, stdout }));
    });
  });

export class SbxSandboxProvider implements SandboxProvider {
  constructor(private readonly run: RunSbx = runSbx) {}

  listAgents(): readonly string[] {
    return AGENTS;
  }

  async checkInstall(): Promise<{ version: string } | undefined> {
    let output: string;
    try {
      output = await this.run(['version', '--json']);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
    const version = parseSbxVersionOutput(output);
    return version ? { version } : undefined;
  }

  sessionCommand({ agent, projectPath, name }: { agent: string; projectPath: string; name: string }): SessionCommand {
    return { command: 'sbx', args: ['run', agent, projectPath, '--name', name, ...agentArgs(agent)] };
  }

  async checkSignIn(): Promise<SignInState> {
    const reported = await this.diagnoseSignIn();
    return reported === 'unknown' ? this.probeSignIn() : reported;
  }

  private async diagnoseSignIn(): Promise<SignInState> {
    try {
      return parseSignIn(await this.run(['diagnose', '--json']));
    } catch (error) {
      const { stdout } = error as { stdout?: unknown };
      return typeof stdout === 'string' ? parseSignIn(stdout) : 'unknown';
    }
  }

  // Signed out, the daemon is down and diagnose skips its Authentication check (observed on v0.49.2):
  // `ls` then decides, since it fails with "try: sbx login" only when signed out.
  private async probeSignIn(): Promise<SignInState> {
    try {
      await this.run(['ls', '--json']);
      return 'signed-in';
    } catch (error) {
      return error instanceof Error && error.message.includes('sbx login') ? 'signed-out' : 'unknown';
    }
  }

  signInCommand(): SessionCommand {
    return { command: 'sbx', args: ['login'] };
  }

  async list(): Promise<SandboxInfo[]> {
    return parseSandboxList(await this.run(['ls', '--json']));
  }

  // Names reach sbx only after use-case validation against `sbx ls`. rm -f skips sbx's own prompt: sandy asks first.
  async stop(name: string): Promise<void> {
    await this.run(['stop', name]);
  }

  async remove(name: string): Promise<void> {
    await this.run(['rm', '-f', name]);
  }

  attachCommand({ name, agent }: { name: string; agent: string }): SessionCommand {
    return { command: 'sbx', args: ['run', '--name', name, ...agentArgs(agent)] };
  }

  async copyIn({ sandboxName, hostPath, sandboxPath }: { sandboxName: string; hostPath: string; sandboxPath: string }): Promise<void> {
    await this.run(['cp', hostPath, `${sandboxName}:${sandboxPath}`]);
  }
}
