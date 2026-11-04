import { expect, it } from 'vitest';
import { displayHost, pendingHosts } from './pending-hosts';

it('hides the hosts kept blocked', () => {
  expect(pendingHosts(['a.com:443', 'b.com:443'], new Set(['a.com:443']))).toEqual(['b.com:443']);
  expect(pendingHosts([], new Set(['a.com:443']))).toEqual([]);
});

it('hides the HTTPS port only', () => {
  expect(displayHost('crocogiciel.com:443')).toBe('crocogiciel.com');
  expect(displayHost('ports.ubuntu.com:80')).toBe('ports.ubuntu.com:80');
});
