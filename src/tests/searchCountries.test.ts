import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchCountries } from '../core/searchCountries';
import { HttpError } from '../core/errors';

const API_BASE = 'https://countries.dev/name';

const japanPayload = [
  {
    name: 'Japan',
    capital: 'Tokyo',
    region: 'Asia',
    population: 125836021,
    flags: { png: 'https://flagcdn.com/w320/jp.png' },
    languages: [{ name: 'Japanese' }],
  },
];

describe('searchCountries', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns parsed array on a successful response', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(japanPayload), { status: 200 })
    );

    const result = await searchCountries('japan', new AbortController().signal);

    expect(result).toEqual(japanPayload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('builds the URL with the query encoded', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));

    await searchCountries('united states', new AbortController().signal);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`${API_BASE}/united%20states`);
  });

  it('returns an empty array on 404 (no matches)', async () => {
    fetchMock.mockResolvedValue(new Response('Not Found', { status: 404 }));

    const result = await searchCountries('zzz', new AbortController().signal);

    expect(result).toEqual([]);
  });

  it('throws HttpError on other non-ok statuses', async () => {
    fetchMock.mockResolvedValue(new Response('Oops', { status: 500 }));

    await expect(
      searchCountries('japan', new AbortController().signal)
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('HttpError carries the status code', async () => {
    fetchMock.mockResolvedValue(new Response('Oops', { status: 503 }));

    await expect(
      searchCountries('japan', new AbortController().signal)
    ).rejects.toMatchObject({ status: 503 });
  });

  it('passes the caller signal to fetch', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    const controller = new AbortController();

    await searchCountries('japan', controller.signal);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('propagates AbortError from fetch as-is', async () => {
    const abortErr = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValue(abortErr);

    await expect(
      searchCountries('japan', new AbortController().signal)
    ).rejects.toBe(abortErr);
  });
});
