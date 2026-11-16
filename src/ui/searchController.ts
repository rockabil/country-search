import type { CountryCard, RawCountry } from '../core/mapCountryResponse.js';
import { debounce } from '../core/debounce.js';
import { mapCountryResponse } from '../core/mapCountryResponse.js';

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

const isAbortError = (err: unknown): boolean =>
  err instanceof DOMException && err.name === 'AbortError';

const errorMessage = (err: unknown): string => {
  if (err instanceof Error && err.message !== '') {
    return err.message;
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string' &&
    (err as { message: string }).message !== ''
  ) {
    return (err as { message: string }).message;
  }
  return 'Unknown error';
};

export function createSearchController(options: Options): SearchController {
  const { search, onStateChange, debounceMs = 300 } = options;
  let lastQuery = '';
  let currentController: AbortController | null = null;

  const runSearch = async (query: string): Promise<void> => {
    currentController?.abort();
    const controller = new AbortController();
    currentController = controller;

    try {
      const raw = await search(query, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      const countries = mapCountryResponse(raw);
      if (countries.length === 0) {
        onStateChange({ kind: 'empty', query });
      } else {
        onStateChange({ kind: 'results', query, countries });
      }
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      const message = errorMessage(err);
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
      currentController?.abort();
      currentController = null;
      debouncedSearch.cancel();
      onStateChange({ kind: 'idle' });
      return;
    }

    currentController?.abort();
    currentController = null;

    onStateChange({ kind: 'loading', query: trimmed });
    debouncedSearch(trimmed);
  };

  const retry = (): void => {
    if (lastQuery !== '') {
      void runSearch(lastQuery);
    }
  };

  const dispose = (): void => {
    currentController?.abort();
    currentController = null;
    debouncedSearch.cancel();
  };

  return { setQuery, retry, dispose };
}
