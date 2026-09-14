import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { FITNESS_CITY_CONFIG, type SupportedFitnessCity } from "@/lib/fitness/cities";

// Places per type for each city, keyed by the latitude the request carries.
function stubPlaces(countsByCity: Record<SupportedFitnessCity, number>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const lat = body.locationRestriction.circle.center.latitude;
      const type = body.includedTypes[0];
      const city = (Object.keys(FITNESS_CITY_CONFIG) as SupportedFitnessCity[]).find(
        (c) => FITNESS_CITY_CONFIG[c].lat === lat
      )!;
      const places = Array.from({ length: countsByCity[city] }, (_, i) => ({ id: `${city}-${type}-${i}` }));
      return Response.json({ places });
    })
  );
}

// The route keeps a module-level cache, so each test gets a fresh copy.
async function get(city: string) {
  const { GET } = await import("@/app/api/fitness-opportunity/route");
  const res = await GET(new NextRequest(`http://localhost/api/fitness-opportunity?city=${city}`));
  return { text: await res.clone().text(), json: await res.json() };
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("GOOGLE_MAPS_API_KEY", "secret-test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GET /api/fitness-opportunity", () => {
  it("returns no density, index or tier when the searches are capped", async () => {
    stubPlaces({ Berlin: 20, Hamburg: 20, Munich: 20, Cologne: 20, Frankfurt: 20 });

    const { json } = await get("Frankfurt");

    expect(json).toMatchObject({
      available: true,
      city: "Frankfurt",
      ranked: false,
      unrankedReason: "capped",
      capped: true,
      locationCount: 80,
      maxResultsPerSearch: 20,
    });
    expect(json).not.toHaveProperty("opportunityIndex");
    expect(json).not.toHaveProperty("tier");
    expect(json).not.toHaveProperty("densityPer100k");
  });

  it("does not rank an uncapped city while another city is capped", async () => {
    stubPlaces({ Berlin: 20, Hamburg: 10, Munich: 10, Cologne: 10, Frankfurt: 10 });

    const { json } = await get("Frankfurt");

    expect(json).toMatchObject({ ranked: false, capped: false, cappedCities: ["Berlin"] });
    expect(json).not.toHaveProperty("tier");
  });

  it("ranks cities when no search is capped", async () => {
    stubPlaces({ Berlin: 19, Hamburg: 19, Munich: 19, Cologne: 19, Frankfurt: 19 });

    const { json } = await get("Berlin");

    expect(json).toMatchObject({ ranked: true, capped: false, cappedCities: [], comparisonCityCount: 5 });
    expect(json.tier).toMatch(/HIGH|MEDIUM|LOW/);
    expect(json.population).toBe(3_685_265);
  });

  it("never sends the API key to the browser", async () => {
    stubPlaces({ Berlin: 20, Hamburg: 20, Munich: 20, Cologne: 20, Frankfurt: 20 });

    const { text } = await get("Berlin");

    expect(text).not.toContain("secret-test-key");
  });
});
