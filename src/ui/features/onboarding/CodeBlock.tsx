import { useEffect, useState } from 'react';
import { tokenizeShell } from './shell-tokens';

const COPIED_MS = 1500;

// A shell command to read and copy: highlighted, never executed by sandy.
export function CodeBlock({ code }: { code: string }) {
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (copy === 'idle') return;
    const timer = setTimeout(() => setCopy('idle'), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copy]);

  async function copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopy('copied');
    } catch {
      setCopy('failed');
    }
  }

  return (
    <div className="code">
      <pre>
        <code>
          {code.split('\n').map((line, index) => (
            <span key={index} className="code-line">
              {tokenizeShell(line).map((token, position) => (
                <span key={position} className={`tok-${token.kind}`}>
                  {token.text}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
      <button type="button" className="code-copy" onClick={() => void copyCode()} aria-label="Copier la commande">
        {copy === 'copied' ? 'Copié' : copy === 'failed' ? 'Copie impossible' : 'Copier'}
      </button>
    </div>
  );
}
