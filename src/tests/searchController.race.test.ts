import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSearchController } from '../ui/searchController';
import type { SearchState } from '../ui/searchController';
import type { RawCountry } from '../core/mapCountryResponse';

const rawSpain: RawCountry = {
  name: 'Spain',
  capital: 'Madrid',
  region: 'Europe',
  population: 47351567,
  flags: { png: 'https://flagcdn.com/w320/es.png' },
  languages: [{ name: 'Spanish' }],
};

const rawSriLanka: RawCountry = {
  name: 'Sri Lanka',
  capital: 'Sri Jayawardenepura Kotte',
  region: 'Asia',
  population: 21919000,
  flags: { png: 'https://flagcdn.com/w320/lk.png' },
  languages: [{ name: 'Sinhala' }],
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const flushPromises = async (): Promise<void> => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

describe('createSearchController — race condition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ignores a stale response that resolves after a newer one', async () => {
    const first = deferred<ReadonlyArray<RawCountry>>();
    const second = deferred<ReadonlyArray<RawCountry>>();
    const pending = [first, second];
    const signals: AbortSignal[] = [];

    const search = vi
      .fn()
      .mockImplementation((_q: string, signal: AbortSignal) => {
        signals.push(signal);
        const d = pending.shift();
        if (d === undefined) {
          throw new Error('unexpected third search call');
        }
        const promise = d.promise;
        return new Promise<ReadonlyArray<RawCountry>>((resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
          promise.then(resolve, reject);
        });
      });

    const states: SearchState[] = [];
    const ctrl = createSearchController({
      search,
      onStateChange: (s) => states.push(s),
      debounceMs: 10,
    });

    ctrl.setQuery('sri');
    await vi.advanceTimersByTimeAsync(10);
    expect(search).toHaveBeenCalledTimes(1);

    ctrl.setQuery('spain');
    await vi.advanceTimersByTimeAsync(10);
    expect(search).toHaveBeenCalledTimes(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);

    second.resolve([rawSpain]);
    await flushPromises();

    first.resolve([rawSriLanka]);
    await flushPromises();

    const resultsStates = states.filter((s) => s.kind === 'results');
    expect(resultsStates).toHaveLength(1);
    const final = resultsStates[0];
    if (final?.kind !== 'results') throw new Error('expected results state');
    expect(final.query).toBe('spain');
    expect(final.countries[0]?.name).toBe('Spain');
  });

  it('does not show error when an in-flight request is superseded', async () => {
    const first = deferred<ReadonlyArray<RawCountry>>();
    const second = deferred<ReadonlyArray<RawCountry>>();
    const pending = [first, second];

    const search = vi
      .fn()
      .mockImplementation((_q: string, signal: AbortSignal) => {
        const d = pending.shift();
        if (d === undefined) throw new Error('unexpected third call');
        return new Promise<ReadonlyArray<RawCountry>>((resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
          d.promise.then(resolve, reject);
        });
      });

    const states: SearchState[] = [];
    const ctrl = createSearchController({
      search,
      onStateChange: (s) => states.push(s),
      debounceMs: 10,
    });

    ctrl.setQuery('sri');
    await vi.advanceTimersByTimeAsync(10);
    ctrl.setQuery('spain');
    await vi.advanceTimersByTimeAsync(10);

    second.resolve([rawSpain]);
    await flushPromises();
    first.resolve([rawSriLanka]);
    await flushPromises();

    expect(states.some((s) => s.kind === 'error')).toBe(false);
  });
});
