// Messages between the node-pty adapter (main process) and the pty-host utilityProcess.
export type PtyRequest =
  | { type: 'open'; id: string; command: string; args: string[]; cwd: string; cols: number; rows: number }
  | { type: 'write'; id: string; data: string }
  | { type: 'resize'; id: string; cols: number; rows: number }
  | { type: 'close'; id: string };

export type PtyEvent =
  | { type: 'opened'; id: string }
  | { type: 'open-failed'; id: string; reason: 'command-not-found' | 'spawn-error'; message: string }
  | { type: 'data'; id: string; data: string }
  | { type: 'exit'; id: string; exitCode: number };
