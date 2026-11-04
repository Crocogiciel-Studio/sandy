// Leading spinner and status glyphs agents put in front of their title (✳, braille spinners, ●…).
const LEADING_GLYPHS = /^[\s←-⯿⠀-⣿■-◿✀-➿]+/u;
// Titles that only name the tool, not the work.
const GENERIC = new Set(['claude', 'claude code', 'codex', 'gemini', 'gemini cli', 'devin', 'sandy', 'terminal']);
const MAX_LENGTH = 80;

// The name an agent publishes through the terminal title (OSC 0/2), or undefined when it says nothing useful.
export function parseTitle(raw: string, agent: string): string | undefined {
  const title = raw.replace(LEADING_GLYPHS, '').replace(/\s+/g, ' ').trim();
  if (!title) return undefined;
  const lower = title.toLowerCase();
  if (GENERIC.has(lower) || lower === agent.toLowerCase()) return undefined;
  return title.length > MAX_LENGTH ? `${title.slice(0, MAX_LENGTH - 1)}…` : title;
}
