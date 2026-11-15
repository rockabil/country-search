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
  raw: ReadonlyArray<RawCountry>
): CountryCard[] {
  return raw.map((country) => ({
    name: country.name,
    flagUrl: country.flags?.png ?? '',
    capital: country.capital ?? '',
    region: country.region,
    population: country.population ?? 0,
    languages: (country.languages ?? []).map((lang) => lang.name),
  }));
}
