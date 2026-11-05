export type QuitChoice = 'keep' | 'stop' | 'cancel';

export interface QuitPrompt {
  message: string;
  detail: string;
  // In dialog order: `quitChoice` maps the clicked index back.
  buttons: string[];
  defaultId: number;
  cancelId: number;
}

// Sessions survive a quit by default; stopping their agents is the explicit choice.
export function quitPrompt(running: number): QuitPrompt | undefined {
  if (running <= 0) return undefined;
  const sessions = running === 1 ? '1 session' : `${running} sessions`;
  return {
    message: `Quit Sandy with ${sessions} running?`,
    detail:
      'Keep running leaves the agents working in the background, using memory and tokens, and Sandy shows them again when it reopens. Stop sessions ends them.',
    buttons: ['Keep running', 'Stop sessions', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
  };
}

export function quitChoice(buttonIndex: number): QuitChoice {
  return buttonIndex === 0 ? 'keep' : buttonIndex === 1 ? 'stop' : 'cancel';
}
