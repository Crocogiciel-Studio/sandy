const MAX_LINE_CHARS = 64 * 1024 * 1024;

export const encodeMessage = (message: unknown): string => `${JSON.stringify(message)}\n`;

// Socket chunks cut messages anywhere: buffers until a newline, then delivers each complete message.
export function createLineDecoder(onMessage: (message: unknown) => void): (chunk: string) => void {
  let buffer = '';
  return (chunk) => {
    buffer += chunk;
    for (let end = buffer.indexOf('\n'); end >= 0; end = buffer.indexOf('\n')) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 1);
      if (!line) continue;
      try {
        onMessage(JSON.parse(line));
      } catch {
        // A malformed line is dropped: the stream stays usable.
      }
    }
    if (buffer.length > MAX_LINE_CHARS) buffer = '';
  };
}
