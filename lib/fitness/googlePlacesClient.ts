import { FITNESS_CITY_CONFIG, type SupportedFitnessCity } from "@/lib/fitness/cities";
import { FITNESS_PLACE_TYPES, PLACES_MAX_RESULTS_PER_SEARCH, isSearchCapped } from "@/lib/fitness/opportunity";
import type { FitnessLocationSample } from "@/lib/fitness/types";

// Places API (New) — Nearby Search. Field mask restricted to `places.id`
// only: we only need place IDs to count and deduplicate locations, and
// requesting the ID-only field mask keeps each call on the cheapest Places
// API (New) SKU rather than pulling name/address/rating data we never use.
const NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby";

async function searchNearbyPlaceIds(
  type: string,
  center: { lat: number; lng: number },
  radiusMeters: number,
  apiKey: string
): Promise<string[]> {
  const res = await fetch(NEARBY_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({
      includedTypes: [type],
      maxResultCount: PLACES_MAX_RESULTS_PER_SEARCH,
      locationRestriction: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: radiusMeters,
        },
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    // Google's error body never contains the request's API key, so this is
    // safe to log — it's what actually tells us "billing not enabled" from
    // "wrong API enabled" from "key restricted" during setup/debugging.
    const errorBody = await res.text().catch(() => "");
    console.error(`[fitness-opportunity] Places API error for type "${type}" (${res.status}): ${errorBody}`);
    throw new Error(`Places API request failed for type "${type}" (${res.status})`);
  }

  const data: { places?: Array<{ id?: string }> } = await res.json();
  return (data.places ?? []).map((p) => p.id).filter((id): id is string => Boolean(id));
}

// Counts unique fitness-related locations in a city's search circle,
// deduped by place ID across every configured place type, and reports
// which type searches came back full. Nearby Search (New) stops at 20
// results per call, so a full search means the count is a lower bound,
// not a census — the caller must not rank cities on it.
//
// Every type search has to succeed: a city missing one type's results
// would be undercounted without anything showing it, so a partial failure
// fails the whole city.
export async function fetchFitnessLocationSample(
  city: SupportedFitnessCity,
  apiKey: string
): Promise<FitnessLocationSample> {
  const config = FITNESS_CITY_CONFIG[city];
  const center = { lat: config.lat, lng: config.lng };

  const results = await Promise.all(
    FITNESS_PLACE_TYPES.map(async (type) => ({
      type,
      ids: await searchNearbyPlaceIds(type, center, config.radiusMeters, apiKey),
    }))
  );

  const uniqueIds = new Set(results.flatMap((r) => r.ids));
  return {
    locationCount: uniqueIds.size,
    cappedTypes: results.filter((r) => isSearchCapped(r.ids.length)).map((r) => r.type),
  };
}
