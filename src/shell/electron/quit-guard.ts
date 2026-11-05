export interface QuitPrompt {
  message: string;
  detail: string;
}

// Quitting is the only gesture that stops every agent at once, so it asks when some are still running.
export function quitPrompt(running: number): QuitPrompt | undefined {
  if (running <= 0) return undefined;
  const sessions = running === 1 ? '1 session' : `${running} sessions`;
  return {
    message: `Quit Sandy and stop ${sessions}?`,
    detail: 'Closing the window keeps sessions running. Quitting stops their agents.',
  };
}
