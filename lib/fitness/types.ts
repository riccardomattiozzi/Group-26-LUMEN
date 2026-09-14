import type { SupportedFitnessCity } from "@/lib/fitness/cities";

export type FitnessTier = "HIGH" | "MEDIUM" | "LOW";

// One city's raw Places result: unique locations across every place-type
// search, plus the searches that came back full (exactly the per-request
// maximum). A full search means there were more places than Google
// returned, so `locationCount` is then only a lower bound.
export interface FitnessLocationSample {
  locationCount: number;
  cappedTypes: string[];
}

// Why a city carries no density, index or tier.
// - "capped": at least one city in the comparison set has a capped count,
//   so no city is ranked (see compareFitnessCities).
// - "too_few_cities": fewer than two cities returned data to compare.
export type FitnessUnrankedReason = "capped" | "too_few_cities";

export interface FitnessRanking {
  densityPer100k: number;
  benchmarkDensityPer100k: number;
  opportunityIndex: number;
  tier: FitnessTier;
}

interface FitnessOpportunityBase {
  city: SupportedFitnessCity;
  locationCount: number;
  population: number;
  capped: boolean; // this city's own count hit the cap
  cappedTypes: string[];
  searchesPerCity: number;
  maxResultsPerSearch: number;
  comparisonCityCount: number; // cities that returned data this round
  cappedCities: SupportedFitnessCity[]; // cities in that set whose count hit the cap
}

export type FitnessOpportunityData =
  | (FitnessOpportunityBase & { ranked: true } & FitnessRanking)
  | (FitnessOpportunityBase & { ranked: false; unrankedReason: FitnessUnrankedReason });

export type FitnessUnavailableReason =
  | "unsupported_city"
  | "missing_api_key"
  | "api_error"
  | "empty_result";

export type FitnessOpportunityResponse =
  | ({ available: true } & FitnessOpportunityData)
  | { available: false; reason: FitnessUnavailableReason };
