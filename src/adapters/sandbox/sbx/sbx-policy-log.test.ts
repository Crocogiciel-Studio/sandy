import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parsePolicyLog } from './sbx-policy-log';

// Contract test: the fixture is a trimmed `sbx policy log NAME --json` capture (sbx 0.51).
const fixture = readFileSync(join(import.meta.dirname, '__fixtures__/policy-log.json'), 'utf8');

describe('parsePolicyLog', () => {
  it('reads host and last_seen of allowed and blocked entries from a real sbx capture', () => {
    const log = parsePolicyLog(fixture);

    expect(log.allowed.map((entry) => entry.host)).toEqual(['api.github.com:443', 'hub.docker.com:443', 'mcp-gateway.docker.internal:80']);
    expect(log.blocked[1]).toEqual({ host: 'crocogiciel.com:443', lastSeen: Date.parse('2026-11-05T00:46:40.481218+01:00') });
  });

  it('drops entries missing a host or a readable date, and tolerates a missing list', () => {
    expect(parsePolicyLog('{"blocked":[{"host":"a.com:443"},{"last_seen":"2026-11-05T00:46:40Z"},null,{"host":"b.com:443","last_seen":"2026-11-05T00:46:40Z"}]}')).toEqual({
      allowed: [],
      blocked: [{ host: 'b.com:443', lastSeen: Date.parse('2026-11-05T00:46:40Z') }],
    });
  });

  it('rejects anything but an object', () => {
    expect(() => parsePolicyLog('[]')).toThrow('expected an object');
    expect(() => parsePolicyLog('')).toThrow('unreadable');
  });
});
