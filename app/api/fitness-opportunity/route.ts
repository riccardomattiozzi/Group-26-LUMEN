import { NextRequest, NextResponse } from "next/server";
import {
  FITNESS_CITY_CONFIG,
  SUPPORTED_FITNESS_CITIES,
  isSupportedFitnessCity,
  type SupportedFitnessCity,
} from "@/lib/fitness/cities";
import { fetchFitnessLocationSample } from "@/lib/fitness/googlePlacesClient";
import {
  FITNESS_PLACE_TYPES,
  PLACES_MAX_RESULTS_PER_SEARCH,
  compareFitnessCities,
} from "@/lib/fitness/opportunity";
import type { FitnessLocationSample, FitnessOpportunityResponse } from "@/lib/fitness/types";

export const dynamic = "force-dynamic";

// Server-side, in-memory, per-instance cache. The Fitness Opportunity Index
// needs a benchmark across all five supported cities, so a request for any
// one city warms (or reuses) the whole set — a city's own Google Places
// data is fetched at most once per TTL window, regardless of how many
// scenario changes or visitors hit the route in that window. This is best
// effort (a fresh serverless instance starts cold), not a persistent cache,
// which is a known limitation of this simple approach.
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type CacheEntry =
  | { sample: FitnessLocationSample; error: false; fetchedAt: number }
  | { error: true; fetchedAt: number };
const cityCache = new Map<SupportedFitnessCity, CacheEntry>();

async function getCitySample(city: SupportedFitnessCity, apiKey: string): Promise<FitnessLocationSample | null> {
  const cached = cityCache.get(city);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.error ? null : cached.sample;
  }
  try {
    const sample = await fetchFitnessLocationSample(city, apiKey);
    cityCache.set(city, { sample, error: false, fetchedAt: Date.now() });
    return sample;
  } catch {
    cityCache.set(city, { error: true, fetchedAt: Date.now() });
    return null;
  }
}

export async function GET(request: NextRequest) {
  const cityParam = request.nextUrl.searchParams.get("city") ?? "";

  if (!isSupportedFitnessCity(cityParam)) {
    return NextResponse.json<FitnessOpportunityResponse>({
      available: false,
      reason: "unsupported_city",
    });
  }
  const city = cityParam;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json<FitnessOpportunityResponse>({
      available: false,
      reason: "missing_api_key",
    });
  }

  const entries = await Promise.all(
    SUPPORTED_FITNESS_CITIES.map(async (c) => ({ city: c, sample: await getCitySample(c, apiKey) }))
  );

  const requested = entries.find((e) => e.city === city)?.sample ?? null;
  if (!requested) {
    return NextResponse.json<FitnessOpportunityResponse>({
      available: false,
      reason: "api_error",
    });
  }
  if (requested.locationCount === 0) {
    return NextResponse.json<FitnessOpportunityResponse>({
      available: false,
      reason: "empty_result",
    });
  }

  // Cities whose Places calls failed are left out of the comparison; cities
  // with a capped count stay in it, and block the ranking for everyone.
  const comparisonSet = entries
    .filter((e): e is { city: SupportedFitnessCity; sample: FitnessLocationSample } => e.sample !== null)
    .map((e) => ({ city: e.city, population: FITNESS_CITY_CONFIG[e.city].population, sample: e.sample }));
  const comparison = compareFitnessCities(comparisonSet);

  const base = {
    available: true as const,
    city,
    locationCount: requested.locationCount,
    population: FITNESS_CITY_CONFIG[city].population,
    capped: requested.cappedTypes.length > 0,
    cappedTypes: requested.cappedTypes,
    searchesPerCity: FITNESS_PLACE_TYPES.length,
    maxResultsPerSearch: PLACES_MAX_RESULTS_PER_SEARCH,
    comparisonCityCount: comparisonSet.length,
    cappedCities: comparison.cappedCities,
  };

  if (!comparison.ranked) {
    return NextResponse.json<FitnessOpportunityResponse>({
      ...base,
      ranked: false,
      unrankedReason: comparison.reason,
    });
  }
  return NextResponse.json<FitnessOpportunityResponse>({
    ...base,
    ranked: true,
    ...comparison.rankings[city]!,
  });
}
