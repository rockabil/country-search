import type { CountryCard, RawCountry } from '../core/mapCountryResponse';
import { debounce } from '../core/debounce';
import { mapCountryResponse } from '../core/mapCountryResponse';

export type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading'; query: string }
  | { kind: 'results'; query: string; countries: CountryCard[] }
  | { kind: 'empty'; query: string }
  | { kind: 'error'; query: string; message: string; retry: () => void };

export type SearchFn = (
  query: string,
  signal: AbortSignal
) => Promise<ReadonlyArray<RawCountry>>;

export type SearchController = {
  setQuery: (query: string) => void;
  retry: () => void;
  dispose: () => void;
};

type Options = {
  search: SearchFn;
  onStateChange: (state: SearchState) => void;
  debounceMs?: number;
};

export function createSearchController(options: Options): SearchController {
  const { search, onStateChange, debounceMs = 300 } = options;
  let lastQuery = '';

  const runSearch = async (query: string): Promise<void> => {
    const controller = new AbortController();
    try {
      const raw = await search(query, controller.signal);
      const countries = mapCountryResponse(raw);
      if (countries.length === 0) {
        onStateChange({ kind: 'empty', query });
      } else {
        onStateChange({ kind: 'results', query, countries });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      onStateChange({
        kind: 'error',
        query,
        message,
        retry: () => void runSearch(query),
      });
    }
  };

  const debouncedSearch = debounce((query: string) => {
    void runSearch(query);
  }, debounceMs);

  const setQuery = (query: string): void => {
    const trimmed = query.trim();
    lastQuery = trimmed;

    if (trimmed === '') {
      debouncedSearch.cancel();
      onStateChange({ kind: 'idle' });
      return;
    }

    onStateChange({ kind: 'loading', query: trimmed });
    debouncedSearch(trimmed);
  };

  const retry = (): void => {
    if (lastQuery !== '') {
      void runSearch(lastQuery);
    }
  };

  const dispose = (): void => {
    debouncedSearch.cancel();
  };

  return { setQuery, retry, dispose };
}
