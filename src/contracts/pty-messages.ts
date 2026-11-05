// Messages between the node-pty adapter (main process) and the pty-host utilityProcess.
export type PtyRequest =
  | { type: 'open'; id: string; command: string; args: string[]; cwd: string; cols: number; rows: number; env?: Record<string, string> }
  | { type: 'write'; id: string; data: string }
  | { type: 'resize'; id: string; cols: number; rows: number }
  | { type: 'close'; id: string };

export type PtyEvent =
  | { type: 'opened'; id: string }
  | { type: 'open-failed'; id: string; reason: 'command-not-found' | 'spawn-error'; message: string }
  | { type: 'data'; id: string; data: string }
  | { type: 'exit'; id: string; exitCode: number };

// Wire protocol between the main process and the detached pty-host, one JSON message per line.
// Bump when a message changes shape; `hello` and `shutdown` never change shape, so any version can stop another.
export const PROTOCOL_VERSION = 1;

export type ClientMessage = { type: 'hello'; token: string; protocol: number } | { type: 'shutdown' } | PtyRequest;

export type HostMessage = { type: 'hello-ok'; protocol: number } | { type: 'hello-refused' } | PtyEvent;
