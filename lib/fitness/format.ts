import type { FitnessOpportunityData } from "@/lib/fitness/types";

type UnrankedFitness = Extract<FitnessOpportunityData, { ranked: false }>;

// "59+" when a search came back full, since the real count is higher.
export function formatLocationCount(data: Pick<FitnessOpportunityData, "locationCount" | "capped">): string {
  return `${data.locationCount}${data.capped ? "+" : ""}`;
}

// One-line version for the map tooltip, which has room for little else.
export function unrankedShortReason(data: UnrankedFitness): string {
  if (data.capped) {
    return `${data.cappedTypes.length} of ${data.searchesPerCity} searches hit the ${data.maxResultsPerSearch}-result cap`;
  }
  if (data.unrankedReason === "capped") return "Other cities' counts are capped";
  return "No other city to compare with";
}

// Plain-language reason a city carries no index or tier, for the badge's
// title.
export function unrankedExplanation(data: UnrankedFitness): string {
  if (data.capped) {
    return (
      `At least ${data.locationCount} fitness locations: ${data.cappedTypes.length} of ` +
      `${data.searchesPerCity} Google Places searches returned the ${data.maxResultsPerSearch}-result ` +
      `maximum, so the real count is higher. Cities are not ranked on capped counts.`
    );
  }
  if (data.unrankedReason === "capped") {
    return (
      `${data.locationCount} fitness locations (complete count). Not ranked because the counts ` +
      `for ${data.cappedCities.join(", ")} are capped.`
    );
  }
  return `${data.locationCount} fitness locations. Not ranked: no other city returned data to compare against.`;
}
