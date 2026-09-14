// City-level config for the Fitness Opportunity signal.
//
// Source for every `population` and `areaKm2` below — one table, one date:
// Statistisches Bundesamt (Destatis), Gemeindeverzeichnis, "Städte nach
// Fläche, Bevölkerung und Bevölkerungsdichte am 31.12.2024", population on
// the basis of the Zensus 2022, published 23 Sep 2025:
// https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/05-staedte.html
// (columns "Fläche km²" and "Bevölkerung ... insgesamt"). These are absolute
// headcounts, not the `population_share_of_market` ratios in
// data/market_context.csv, so the two don't collide even though they
// describe the same five cities.
//
// The Places search is a single circle centred on each city's core. Its
// radius is derived from the city's own Destatis area (a circle of equal
// area), so the searched area matches the municipality whose population we
// divide by. It is still an approximation: the circle has the same size as
// the city, not the same shape, so it can spill past the border in one
// direction and miss outlying districts in another.

export type SupportedFitnessCity = "Berlin" | "Munich" | "Hamburg" | "Cologne" | "Frankfurt";

export const SUPPORTED_FITNESS_CITIES: SupportedFitnessCity[] = [
  "Berlin",
  "Munich",
  "Hamburg",
  "Cologne",
  "Frankfurt",
];

export interface FitnessCityConfig {
  lat: number;
  lng: number;
  population: number;
  areaKm2: number;
  radiusMeters: number;
}

// Radius of the circle whose area equals the city's area.
export function equalAreaRadiusMeters(areaKm2: number): number {
  return Math.round(Math.sqrt(areaKm2 / Math.PI) * 1000);
}

function city(lat: number, lng: number, population: number, areaKm2: number): FitnessCityConfig {
  return { lat, lng, population, areaKm2, radiusMeters: equalAreaRadiusMeters(areaKm2) };
}

export const FITNESS_CITY_CONFIG: Record<SupportedFitnessCity, FitnessCityConfig> = {
  Berlin: city(52.520008, 13.404954, 3_685_265, 891.12),
  Munich: city(48.137154, 11.576124, 1_505_005, 310.7),
  Hamburg: city(53.551086, 9.993682, 1_862_565, 755.09),
  Cologne: city(50.937531, 6.960279, 1_024_621, 405.02),
  Frankfurt: city(50.110924, 8.682127, 756_021, 248.31),
};

export function isSupportedFitnessCity(value: string): value is SupportedFitnessCity {
  return (SUPPORTED_FITNESS_CITIES as string[]).includes(value);
}
