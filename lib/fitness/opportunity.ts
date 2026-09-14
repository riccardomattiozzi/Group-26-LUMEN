import type { SupportedFitnessCity } from "@/lib/fitness/cities";
import type {
  FitnessLocationSample,
  FitnessRanking,
  FitnessTier,
  FitnessUnrankedReason,
} from "@/lib/fitness/types";

// Google Places API (New) place types treated as "fitness locations" for
// this signal. Kept as a flat list (not per-type weighting) so the
// methodology stays simple and transparent, per the case brief.
export const FITNESS_PLACE_TYPES = [
  "gym",
  "fitness_center",
  "sports_club",
  "sports_activity_location",
] as const;

// Nearby Search (New) returns at most 20 places per request and has no
// pagination, so a search that comes back with exactly 20 almost certainly
// stopped early: the real number of places in the circle is unknown.
export const PLACES_MAX_RESULTS_PER_SEARCH = 20;

export function isSearchCapped(resultCount: number): boolean {
  return resultCount >= PLACES_MAX_RESULTS_PER_SEARCH;
}

export function computeDensityPer100k(locationCount: number, population: number): number {
  if (population <= 0) return 0;
  return (locationCount / population) * 100_000;
}

// Benchmark = the plain average density across the cities being compared.
// Simple and transparent by construction: no weighting, no external
// reference values.
export function computeBenchmarkDensity(densities: number[]): number {
  if (densities.length === 0) return 0;
  return densities.reduce((sum, d) => sum + d, 0) / densities.length;
}

export function computeOpportunityIndex(density: number, benchmarkDensity: number): number {
  if (benchmarkDensity <= 0) return 0;
  return density / benchmarkDensity;
}

export function classifyFitnessTier(opportunityIndex: number): FitnessTier {
  if (opportunityIndex >= 1.15) return "HIGH";
  if (opportunityIndex >= 0.95) return "MEDIUM";
  return "LOW";
}

export interface FitnessCityInput {
  city: SupportedFitnessCity;
  population: number;
  sample: FitnessLocationSample;
}

export type FitnessComparison =
  | {
      ranked: true;
      cappedCities: SupportedFitnessCity[];
      rankings: Partial<Record<SupportedFitnessCity, FitnessRanking>>;
    }
  | {
      ranked: false;
      reason: FitnessUnrankedReason;
      cappedCities: SupportedFitnessCity[];
    };

// Ranks cities on fitness-location density only when every count in the
// comparison is complete. One capped city blocks the ranking for all of
// them, rather than being dropped from the benchmark: capped cities are the
// ones with the most places, so leaving them out would pull the average
// down and flatter every city that remained.
export function compareFitnessCities(inputs: FitnessCityInput[]): FitnessComparison {
  const cappedCities = inputs.filter((i) => i.sample.cappedTypes.length > 0).map((i) => i.city);
  if (cappedCities.length > 0) {
    return { ranked: false, reason: "capped", cappedCities };
  }
  if (inputs.length < 2) {
    return { ranked: false, reason: "too_few_cities", cappedCities };
  }

  const densities = inputs.map((i) => ({
    city: i.city,
    density: computeDensityPer100k(i.sample.locationCount, i.population),
  }));
  const benchmarkDensityPer100k = computeBenchmarkDensity(densities.map((d) => d.density));

  const rankings: Partial<Record<SupportedFitnessCity, FitnessRanking>> = {};
  for (const { city, density } of densities) {
    const opportunityIndex = computeOpportunityIndex(density, benchmarkDensityPer100k);
    rankings[city] = {
      densityPer100k: density,
      benchmarkDensityPer100k,
      opportunityIndex,
      tier: classifyFitnessTier(opportunityIndex),
    };
  }
  return { ranked: true, cappedCities, rankings };
}
