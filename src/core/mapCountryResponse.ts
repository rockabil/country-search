export type CountryCard = {
  name: string;
  flagUrl: string;
  capital: string;
  region: string;
  population: number;
  languages: string[];
};

export type RawCountry = {
  name: string;
  capital?: string;
  region: string;
  population?: number;
  flags?: { png?: string; svg?: string };
  languages?: ReadonlyArray<{ readonly name: string }>;
};

export function mapCountryResponse(
  _raw: ReadonlyArray<RawCountry>
): CountryCard[] {
  void _raw;
  throw new Error('mapCountryResponse: not implemented yet');
}
