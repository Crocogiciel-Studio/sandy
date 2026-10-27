import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createActivityTracker } from './session-activity';

describe('createActivityTracker', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reports working once, then waiting after the quiet period', () => {
    const onChange = vi.fn();
    const tracker = createActivityTracker(onChange, 1000);
    tracker.touch();
    vi.advanceTimersByTime(500);
    tracker.touch();
    expect(onChange.mock.calls).toEqual([['working']]);
    vi.advanceTimersByTime(1000);
    expect(onChange.mock.calls).toEqual([['working'], ['waiting']]);
  });

  it('goes back to working on new output', () => {
    const onChange = vi.fn();
    const tracker = createActivityTracker(onChange, 1000);
    tracker.touch();
    vi.advanceTimersByTime(1000);
    tracker.touch();
    expect(onChange.mock.calls.at(-1)).toEqual(['working']);
  });

  it('stops reporting after stop', () => {
    const onChange = vi.fn();
    const tracker = createActivityTracker(onChange, 1000);
    tracker.touch();
    tracker.stop();
    vi.advanceTimersByTime(5000);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
