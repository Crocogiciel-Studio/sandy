import { describe, expect, it } from 'vitest';
import { activeBlockedHosts, isAllowableHost } from './blocked-domain';

describe('isAllowableHost', () => {
  it('accepts one exact host, with or without a port', () => {
    expect(isAllowableHost('registry.npmjs.org')).toBe(true);
    expect(isAllowableHost('crocogiciel.com:443')).toBe(true);
  });

  it.each(['*', '*.npmjs.org', '**', 'a b', '-x', '--sandbox', 'x.com/path', 'x.com:', 'x..com', '', 'x.com,y.com'])(
    'refuses %j',
    (host) => expect(isAllowableHost(host)).toBe(false),
  );
});

describe('activeBlockedHosts', () => {
  const log = {
    allowed: [{ host: 'b.com:443', lastSeen: 300 }],
    blocked: [
      { host: 'old.com:443', lastSeen: 50 },
      { host: 'a.com:443', lastSeen: 200 },
      { host: 'b.com:443', lastSeen: 250 },
      { host: 'c.com:443', lastSeen: 400 },
      { host: 'a.com:443', lastSeen: 210 },
    ],
  };

  it('keeps hosts blocked since the session opened, once each', () => {
    expect(activeBlockedHosts(log, 100)).toEqual(['a.com:443', 'c.com:443']);
  });

  it('drops a host that was allowed after its last block', () => {
    expect(activeBlockedHosts(log, 100)).not.toContain('b.com:443');
  });

  it('keeps a host blocked again after it was allowed', () => {
    expect(activeBlockedHosts({ ...log, blocked: [{ host: 'b.com:443', lastSeen: 500 }] }, 100)).toEqual(['b.com:443']);
  });
});
