import type { CountryCard, RawCountry } from '../core/mapCountryResponse';

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

export function createSearchController(_options: {
  search: SearchFn;
  onStateChange: (state: SearchState) => void;
  debounceMs?: number;
}): SearchController {
  void _options;
  throw new Error('createSearchController: not implemented yet');
}
