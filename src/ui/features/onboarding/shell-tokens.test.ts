import { describe, expect, it } from 'vitest';
import { tokenizeShell } from './shell-tokens';

const kinds = (line: string) => tokenizeShell(line).filter((token) => token.kind !== 'text' || token.text.trim() !== '');
const pairs = (line: string) => kinds(line).map((token) => [token.kind, token.text]);

describe('tokenizeShell', () => {
  it('marks the command and leaves its arguments plain', () => {
    expect(pairs('brew install docker/tap/sbx')).toEqual([
      ['command', 'brew'],
      ['text', 'install'],
      ['text', 'docker/tap/sbx'],
    ]);
  });

  it('marks flags, including combined short ones', () => {
    expect(pairs('winget install -h Docker.sbx')[2]).toEqual(['flag', '-h']);
    expect(pairs('curl -fsSL https://get.docker.com')[1]).toEqual(['flag', '-fsSL']);
  });

  it('starts a new command after a pipe, and after sudo', () => {
    expect(pairs('curl -fsSL https://x.sh | sudo SBX=1 sh')).toEqual([
      ['command', 'curl'],
      ['flag', '-fsSL'],
      ['text', 'https://x.sh'],
      ['operator', '|'],
      ['command', 'sudo'],
      ['variable', 'SBX=1'],
      ['command', 'sh'],
    ]);
  });

  it('marks quoted strings, variables and comments', () => {
    expect(pairs('echo "a b" $HOME # note')).toEqual([
      ['command', 'echo'],
      ['string', '"a b"'],
      ['variable', '$HOME'],
      ['comment', '# note'],
    ]);
  });

  it('keeps every character: joining the pieces gives the line back', () => {
    const line = "sudo  usermod -aG kvm $USER && echo 'ok'   # done";
    expect(tokenizeShell(line).map((token) => token.text).join('')).toBe(line);
  });

  it('copes with an empty line', () => {
    expect(tokenizeShell('')).toEqual([]);
  });
});
