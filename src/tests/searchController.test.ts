import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSearchController } from '../ui/searchController';
import type { RawCountry } from '../core/mapCountryResponse';

const rawJapan: RawCountry = {
  name: 'Japan',
  capital: 'Tokyo',
  region: 'Asia',
  population: 125836021,
  flags: { png: 'https://flagcdn.com/w320/jp.png' },
  languages: [{ name: 'Japanese' }],
};

const flushPromises = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

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
});
