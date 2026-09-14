import { describe, expect, it } from "vitest";
import { formatLocationCount, unrankedExplanation, unrankedShortReason } from "@/lib/fitness/format";
import type { FitnessOpportunityData } from "@/lib/fitness/types";

type Unranked = Extract<FitnessOpportunityData, { ranked: false }>;

const cappedBerlin: Unranked = {
  city: "Berlin",
  locationCount: 59,
  population: 3_685_265,
  capped: true,
  cappedTypes: ["gym", "fitness_center", "sports_club"],
  searchesPerCity: 4,
  maxResultsPerSearch: 20,
  comparisonCityCount: 5,
  cappedCities: ["Berlin", "Hamburg"],
  ranked: false,
  unrankedReason: "capped",
};

describe("formatLocationCount", () => {
  it("marks a capped count as a lower bound", () => {
    expect(formatLocationCount({ locationCount: 59, capped: true })).toBe("59+");
  });

  it("prints a complete count as is", () => {
    expect(formatLocationCount({ locationCount: 40, capped: false })).toBe("40");
  });
});

describe("unranked explanations", () => {
  it("say how many of the city's own searches hit the cap", () => {
    expect(unrankedShortReason(cappedBerlin)).toBe("3 of 4 searches hit the 20-result cap");
    expect(unrankedExplanation(cappedBerlin)).toContain("At least 59 fitness locations");
  });

  it("name the capped cities when this city's own count is complete", () => {
    const cologne: Unranked = { ...cappedBerlin, city: "Cologne", locationCount: 40, capped: false, cappedTypes: [] };
    expect(unrankedShortReason(cologne)).toBe("Other cities' counts are capped");
    expect(unrankedExplanation(cologne)).toBe(
      "40 fitness locations (complete count). Not ranked because the counts for Berlin, Hamburg are capped."
    );
  });

  it("explain a missing comparison set", () => {
    const alone: Unranked = {
      ...cappedBerlin,
      capped: false,
      cappedTypes: [],
      cappedCities: [],
      comparisonCityCount: 1,
      unrankedReason: "too_few_cities",
    };
    expect(unrankedShortReason(alone)).toBe("No other city to compare with");
  });
});
