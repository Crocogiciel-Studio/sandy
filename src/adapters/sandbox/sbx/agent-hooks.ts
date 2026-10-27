// Claude Code hooks report the agent's state to sandy as an OSC sequence on its terminal.
// Hooks have no controlling tty, so the command looks for the pty on the nearest ancestor process.
// OSC number and payloads are read back by src/ui/features/terminal/session-activity.ts.
const REPORT = (state: string): string =>
  `p=$$; while [ "$p" -gt 1 ]; do t=$(readlink /proc/$p/fd/1 2>/dev/null); case "$t" in /dev/pts/*) printf '\\033]9999;${state}\\007' > "$t"; break;; esac; p=$(sed 's/.*) //' /proc/$p/stat 2>/dev/null | cut -d' ' -f2); [ -n "$p" ] || break; done; true`;

const hook = (state: string, matcher?: string) => [{ ...(matcher ? { matcher } : {}), hooks: [{ type: 'command', command: REPORT(state) }] }];

const CLAUDE_SETTINGS = JSON.stringify({
  hooks: {
    UserPromptSubmit: hook('working'),
    PostToolUse: hook('working'),
    Notification: hook('attention', 'permission_prompt|elicitation_dialog'),
    Stop: hook('waiting'),
  },
});

// Extra arguments handed to the agent after `--`; only agents with hooks get any.
export function agentArgs(agent: string): string[] {
  return agent === 'claude' ? ['--', '--settings', CLAUDE_SETTINGS] : [];
}
