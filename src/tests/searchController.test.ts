import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSearchController } from '../ui/searchController';
import type { RawCountry } from '../core/mapCountryResponse';
import { HttpError } from '../core/errors';

const rawJapan: RawCountry = {
  name: 'Japan',
  capital: 'Tokyo',
  region: 'Asia',
  population: 125836021,
  flags: { png: 'https://flagcdn.com/w320/jp.png' },
  languages: [{ name: 'Japanese' }],
};

const flushPromises = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
};

describe('createSearchController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits idle on empty query without calling search', async () => {
    const search = vi.fn();
    const states: unknown[] = [];
    const ctrl = createSearchController({
      search,
      onStateChange: (s) => states.push(s),
      debounceMs: 100,
    });

    ctrl.setQuery('');

    expect(states.at(-1)).toEqual({ kind: 'idle' });
    expect(search).not.toHaveBeenCalled();
  });

  it('emits loading immediately and results after debounce', async () => {
    const search = vi.fn().mockResolvedValue([rawJapan]);
    const states: unknown[] = [];
    const ctrl = createSearchController({
      search,
      onStateChange: (s) => states.push(s),
      debounceMs: 100,
    });

    ctrl.setQuery('japan');
    expect(states.at(-1)).toEqual({ kind: 'loading', query: 'japan' });
    expect(search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    await flushPromises();

    expect(search).toHaveBeenCalledWith('japan', expect.any(AbortSignal));
    expect(states.at(-1)).toMatchObject({
      kind: 'results',
      query: 'japan',
    });
  });

  it('emits empty when search returns []', async () => {
    const search = vi.fn().mockResolvedValue([]);
    const states: unknown[] = [];
    const ctrl = createSearchController({
      search,
      onStateChange: (s) => states.push(s),
      debounceMs: 100,
    });

    ctrl.setQuery('zzz');
    await vi.advanceTimersByTimeAsync(100);
    await flushPromises();

    expect(states.at(-1)).toEqual({ kind: 'empty', query: 'zzz' });
  });

  it('emits error with retry when search rejects with non-abort error', async () => {
    const search = vi.fn().mockRejectedValue(new Error('network down'));
    const states: Array<{ kind: string }> = [];
    const ctrl = createSearchController({
      search,
      onStateChange: (s) => states.push(s as { kind: string }),
      debounceMs: 100,
    });

    ctrl.setQuery('japan');
    await vi.advanceTimersByTimeAsync(100);
    await flushPromises();

    const last = states.at(-1) as {
      kind: string;
      message: string;
      retry: () => void;
    };
    expect(last.kind).toBe('error');
    expect(last.message).toBe('network down');
    expect(typeof last.retry).toBe('function');
  });

  it('aborts the previous request when a new query arrives', async () => {
    const signals: AbortSignal[] = [];
    const search = vi
      .fn()
      .mockImplementation((_q: string, signal: AbortSignal) => {
        signals.push(signal);
        return new Promise<ReadonlyArray<RawCountry>>(() => {});
      });
    const ctrl = createSearchController({
      search,
      onStateChange: () => {},
      debounceMs: 10,
    });

    ctrl.setQuery('sp');
    await vi.advanceTimersByTimeAsync(10);
    expect(signals).toHaveLength(1);

    ctrl.setQuery('spain');
    await vi.advanceTimersByTimeAsync(10);

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it('does not emit error when the request is aborted by a new query', async () => {
    const states: Array<{ kind: string }> = [];
    const search = vi
      .fn()
      .mockImplementation((_q: string, signal: AbortSignal) => {
        return new Promise<ReadonlyArray<RawCountry>>((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      });
    const ctrl = createSearchController({
      search,
      onStateChange: (s) => states.push(s as { kind: string }),
      debounceMs: 10,
    });

    ctrl.setQuery('sp');
    await vi.advanceTimersByTimeAsync(10);
    ctrl.setQuery('spain');
    await vi.advanceTimersByTimeAsync(10);
    await flushPromises();

    expect(states.some((s) => s.kind === 'error')).toBe(false);
  });

  it('emits error with message on TimeoutError', async () => {
    const states: Array<{ kind: string; message?: string }> = [];
    const search = vi
      .fn()
      .mockRejectedValue(
        new DOMException('The operation timed out', 'TimeoutError')
      );
    const ctrl = createSearchController({
      search,
      onStateChange: (s) =>
        states.push(s as { kind: string; message?: string }),
      debounceMs: 10,
    });

    ctrl.setQuery('japan');
    await vi.advanceTimersByTimeAsync(10);
    await flushPromises();

    const last = states.at(-1);
    expect(last?.kind).toBe('error');
    expect(last?.message).toBe('The operation timed out');
  });

  it('emits error with message on HttpError', async () => {
    const states: Array<{ kind: string; message?: string }> = [];
    const search = vi
      .fn()
      .mockRejectedValue(new HttpError(503, 'Service unavailable'));
    const ctrl = createSearchController({
      search,
      onStateChange: (s) =>
        states.push(s as { kind: string; message?: string }),
      debounceMs: 10,
    });

    ctrl.setQuery('japan');
    await vi.advanceTimersByTimeAsync(10);
    await flushPromises();

    const last = states.at(-1);
    expect(last?.kind).toBe('error');
    expect(last?.message).toBe('Service unavailable');
  });
});
