import { describe, expect, it } from 'vitest';
import { noticeFor } from './notify-transition';

const base = { previous: 'working', next: 'waiting', looking: false, name: 'claude' } as const;

describe('noticeFor', () => {
  it('notifies when the agent turns waiting', () => {
    expect(noticeFor(base)).toEqual({ title: 'claude', body: 'Your turn' });
  });

  it('notifies when the agent needs permission', () => {
    expect(noticeFor({ ...base, next: 'attention' })).toEqual({ title: 'claude', body: 'Needs your permission' });
  });

  it('notifies when a session without hooks ends', () => {
    expect(noticeFor({ ...base, previous: 'running', next: 'ended', exitCode: 0 })).toEqual({ title: 'claude', body: 'Ended (0)' });
  });

  it('stays quiet when the state did not change', () => {
    expect(noticeFor({ ...base, previous: 'waiting' })).toBeUndefined();
  });

  it('stays quiet when the agent starts working', () => {
    expect(noticeFor({ ...base, previous: 'waiting', next: 'working' })).toBeUndefined();
  });

  it('stays quiet while the user is looking at the session', () => {
    expect(noticeFor({ ...base, looking: true })).toBeUndefined();
  });

  it('does not notify again once ended', () => {
    expect(noticeFor({ ...base, previous: 'ended' })).toBeUndefined();
  });
});
