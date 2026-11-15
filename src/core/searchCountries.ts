import type { RawCountry } from './mapCountryResponse';
import { HttpError } from './errors';

export const DEFAULT_TIMEOUT_MS = 5000;

const API_BASE = 'https://countries.dev/name';

export async function searchCountries(
  query: string,
  signal: AbortSignal,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ReadonlyArray<RawCountry>> {
  void timeoutMs;
  const url = `${API_BASE}/${encodeURIComponent(query)}`;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const compositeSignal = AbortSignal.any([signal, timeoutSignal]);
  const response = await fetch(url, { signal: compositeSignal });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(response.status, `HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  return data as ReadonlyArray<RawCountry>;
}
