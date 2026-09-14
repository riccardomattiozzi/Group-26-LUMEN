import { describe, expect, it } from "vitest";
import { FITNESS_CITY_CONFIG, SUPPORTED_FITNESS_CITIES, type SupportedFitnessCity } from "@/lib/fitness/cities";
import {
  PLACES_MAX_RESULTS_PER_SEARCH,
  classifyFitnessTier,
  compareFitnessCities,
  computeBenchmarkDensity,
  computeDensityPer100k,
  computeOpportunityIndex,
  isSearchCapped,
  type FitnessCityInput,
} from "@/lib/fitness/opportunity";

function input(city: SupportedFitnessCity, locationCount: number, cappedTypes: string[] = []): FitnessCityInput {
  return { city, population: FITNESS_CITY_CONFIG[city].population, sample: { locationCount, cappedTypes } };
}

describe("computeDensityPer100k", () => {
  it("scales location count to a per-100k-inhabitants rate", () => {
    expect(computeDensityPer100k(200, 1_000_000)).toBeCloseTo(20, 5);
  });

  it("returns 0 for non-positive population instead of dividing by zero", () => {
    expect(computeDensityPer100k(50, 0)).toBe(0);
    expect(computeDensityPer100k(50, -1)).toBe(0);
  });
});

describe("computeBenchmarkDensity", () => {
  it("averages densities across cities", () => {
    expect(computeBenchmarkDensity([10, 20, 30])).toBeCloseTo(20, 5);
  });

  it("returns 0 for an empty benchmark set", () => {
    expect(computeBenchmarkDensity([])).toBe(0);
  });
});

describe("computeOpportunityIndex", () => {
  it("is 1 when a city sits exactly at the benchmark", () => {
    expect(computeOpportunityIndex(20, 20)).toBeCloseTo(1, 5);
  });

  it("returns 0 when the benchmark is not positive, instead of dividing by zero", () => {
    expect(computeOpportunityIndex(20, 0)).toBe(0);
  });
});

describe("classifyFitnessTier", () => {
  it("classifies HIGH at and above 1.15", () => {
    expect(classifyFitnessTier(1.15)).toBe("HIGH");
    expect(classifyFitnessTier(1.4)).toBe("HIGH");
  });

  it("classifies MEDIUM between 0.95 and 1.149", () => {
    expect(classifyFitnessTier(0.95)).toBe("MEDIUM");
    expect(classifyFitnessTier(1.0)).toBe("MEDIUM");
    expect(classifyFitnessTier(1.149)).toBe("MEDIUM");
  });

  it("classifies LOW below 0.95", () => {
    expect(classifyFitnessTier(0.94)).toBe("LOW");
    expect(classifyFitnessTier(0)).toBe("LOW");
  });
});

describe("isSearchCapped", () => {
  it("treats a search that returns exactly the 20-result maximum as capped", () => {
    expect(PLACES_MAX_RESULTS_PER_SEARCH).toBe(20);
    expect(isSearchCapped(20)).toBe(true);
  });

  it("treats anything under the maximum as a complete result", () => {
    expect(isSearchCapped(19)).toBe(false);
    expect(isSearchCapped(0)).toBe(false);
  });
});

describe("compareFitnessCities", () => {
  it("does not rank the five cities on the capped live counts from 14 Sep", () => {
    // Every type search full: the counts (59, 60, 57, 58, 54) are lower
    // bounds, and per-100k density on them would just invert population.
    const allTypes = ["gym", "fitness_center", "sports_club", "sports_activity_location"];
    const comparison = compareFitnessCities([
      input("Berlin", 59, allTypes),
      input("Hamburg", 60, allTypes),
      input("Munich", 57, allTypes),
      input("Cologne", 58, allTypes),
      input("Frankfurt", 54, allTypes),
    ]);

    expect(comparison.ranked).toBe(false);
    if (comparison.ranked) return;
    expect(comparison.reason).toBe("capped");
    expect(comparison.cappedCities).toEqual(["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"]);
    expect(comparison).not.toHaveProperty("rankings");
  });

  it("blocks the ranking for every city when a single search in a single city is capped", () => {
    const comparison = compareFitnessCities([
      input("Berlin", 900),
      input("Hamburg", 500),
      input("Munich", 400),
      input("Cologne", 250, ["sports_club"]),
      input("Frankfurt", 190),
    ]);

    expect(comparison).toEqual({ ranked: false, reason: "capped", cappedCities: ["Cologne"] });
  });

  it("ranks cities on density once every count is complete", () => {
    // Same density (10 per 100k) everywhere except Frankfurt at 20.
    const inputs: FitnessCityInput[] = [
      { city: "Berlin", population: 1_000_000, sample: { locationCount: 100, cappedTypes: [] } },
      { city: "Hamburg", population: 1_000_000, sample: { locationCount: 100, cappedTypes: [] } },
      { city: "Munich", population: 1_000_000, sample: { locationCount: 100, cappedTypes: [] } },
      { city: "Cologne", population: 1_000_000, sample: { locationCount: 100, cappedTypes: [] } },
      { city: "Frankfurt", population: 1_000_000, sample: { locationCount: 200, cappedTypes: [] } },
    ];
    const comparison = compareFitnessCities(inputs);

    expect(comparison.ranked).toBe(true);
    if (!comparison.ranked) return;
    expect(comparison.cappedCities).toEqual([]);
    const berlin = comparison.rankings.Berlin!;
    const frankfurt = comparison.rankings.Frankfurt!;
    expect(berlin.benchmarkDensityPer100k).toBeCloseTo(12, 5);
    expect(frankfurt.densityPer100k).toBeCloseTo(20, 5);
    expect(frankfurt.opportunityIndex).toBeCloseTo(20 / 12, 5);
    expect(frankfurt.tier).toBe("HIGH");
    expect(berlin.opportunityIndex).toBeCloseTo(10 / 12, 5);
    expect(berlin.tier).toBe("LOW");
  });

  it("refuses to rank with fewer than two cities to compare", () => {
    expect(compareFitnessCities([input("Berlin", 120)])).toEqual({
      ranked: false,
      reason: "too_few_cities",
      cappedCities: [],
    });
    expect(compareFitnessCities([])).toMatchObject({ ranked: false, reason: "too_few_cities" });
  });

  it("reports a lone capped city as capped rather than as too few cities", () => {
    expect(compareFitnessCities([input("Berlin", 20, ["gym"])])).toMatchObject({
      ranked: false,
      reason: "capped",
    });
  });
});

describe("FITNESS_CITY_CONFIG", () => {
  it("uses the Destatis populations for 31 Dec 2024 (Zensus 2022 basis) for all five cities", () => {
    expect(Object.fromEntries(SUPPORTED_FITNESS_CITIES.map((c) => [c, FITNESS_CITY_CONFIG[c].population]))).toEqual({
      Berlin: 3_685_265,
      Munich: 1_505_005,
      Hamburg: 1_862_565,
      Cologne: 1_024_621,
      Frankfurt: 756_021,
    });
  });

  it("sizes each search circle to the city's own area", () => {
    for (const c of SUPPORTED_FITNESS_CITIES) {
      const { areaKm2, radiusMeters } = FITNESS_CITY_CONFIG[c];
      const circleKm2 = Math.PI * (radiusMeters / 1000) ** 2;
      expect(Math.abs(circleKm2 - areaKm2) / areaKm2).toBeLessThan(0.001);
      // Places API (New) rejects a circle radius above 50 km.
      expect(radiusMeters).toBeLessThanOrEqual(50_000);
    }
  });
});
