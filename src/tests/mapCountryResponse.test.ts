import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from '../core/mapCountryResponse';
import { japanRaw } from './fixtures/japan';

describe('mapCountryResponse', () => {
  it('maps a raw country to a card view model', () => {
    const result = mapCountryResponse(japanRaw);

    expect(result).toEqual([
      {
        name: 'Japan',
        flagUrl: 'https://flagcdn.com/w320/jp.png',
        capital: 'Tokyo',
        region: 'Asia',
        population: 125836021,
        languages: ['Japanese'],
      },
    ]);
  });

  it('returns an empty array for an empty input', () => {
    expect(mapCountryResponse([])).toEqual([]);
  });

  it('handles missing optional fields gracefully', () => {
    const result = mapCountryResponse([{ name: 'Nowhere', region: 'Unknown' }]);

    expect(result).toEqual([
      {
        name: 'Nowhere',
        flagUrl: '',
        capital: '',
        region: 'Unknown',
        population: 0,
        languages: [],
      },
    ]);
  });

  it('maps multiple countries preserving order', () => {
    const result = mapCountryResponse([
      { name: 'A', region: 'R1' },
      { name: 'B', region: 'R2' },
    ]);

    expect(result.map((c) => c.name)).toEqual(['A', 'B']);
  });
});
