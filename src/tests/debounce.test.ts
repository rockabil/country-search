import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../core/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("doesn't call the function immediately when called", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();
  });

  it('call function once after delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets the timer when called again', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes the last arguments to the called function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('a', 1);
    debounced('b', 2);
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b', 2);
  });

  it('use context this of the last call', () => {
    const obj = {
      value: 42,
      method: vi.fn(),
    };
    const debounced = debounce(function (this: typeof obj) {
      obj.method(this.value);
    }, 300);

    debounced.call(obj);
    vi.advanceTimersByTime(300);

    expect(obj.method).toHaveBeenCalledWith(42);
  });

  it('allows to cancel a pending call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(300);

    expect(fn).not.toHaveBeenCalled();
  });
});
