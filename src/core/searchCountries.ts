import type { RawCountry } from './mapCountryResponse';

export const DEFAULT_TIMEOUT_MS = 5000;

export async function searchCountries(
  _query: string,
  _signal: AbortSignal,
  _timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ReadonlyArray<RawCountry>> {
  void _query;
  void _signal;
  void _timeoutMs;
  throw new Error('searchCountries: not implemented yet');
}
