// Formats dropped file paths as agent input: shell-quoted when needed, space-separated,
// with a trailing space so the user can keep typing. Never ends with a newline.
export function formatDroppedPaths(paths: readonly string[]): string {
  return paths.map(quote).join(' ') + (paths.length > 0 ? ' ' : '');
}

function quote(path: string): string {
  const clean = path.replace(/[\u0000-\u001f\u007f]/g, '');
  return /^[\w@%+=:,./-]+$/.test(clean) ? clean : `'${clean.replaceAll("'", "'\\''")}'`;
}
