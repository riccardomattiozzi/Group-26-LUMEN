import { afterEach, describe, expect, it, vi } from "vitest";
import { FITNESS_CITY_CONFIG } from "@/lib/fitness/cities";
import { fetchFitnessLocationSample } from "@/lib/fitness/googlePlacesClient";

type FakeResults = Record<string, string[] | "error">;

function stubPlaces(results: FakeResults) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    const ids = results[body.includedTypes[0]];
    if (ids === "error") return new Response("quota", { status: 429 });
    return Response.json({ places: ids.map((id) => ({ id })) });
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  return fetchMock;
}

const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchFitnessLocationSample", () => {
  it("flags every type search that returns exactly 20 places as capped", async () => {
    stubPlaces({
      gym: ids("g", 20),
      fitness_center: ids("f", 19),
      sports_club: ids("s", 20),
      sports_activity_location: ids("a", 3),
    });

    const sample = await fetchFitnessLocationSample("Berlin", "test-key");

    expect(sample.cappedTypes).toEqual(["gym", "sports_club"]);
    expect(sample.locationCount).toBe(62);
  });

  it("reports no capped types when every search comes back short", async () => {
    stubPlaces({
      gym: ids("g", 5),
      fitness_center: ids("g", 5), // same places as gym: deduped
      sports_club: ids("s", 19),
      sports_activity_location: [],
    });

    const sample = await fetchFitnessLocationSample("Munich", "test-key");

    expect(sample).toEqual({ locationCount: 24, cappedTypes: [] });
  });

  it("fails the whole city when one type search fails, instead of undercounting", async () => {
    stubPlaces({
      gym: ids("g", 5),
      fitness_center: "error",
      sports_club: ids("s", 5),
      sports_activity_location: ids("a", 5),
    });

    await expect(fetchFitnessLocationSample("Hamburg", "test-key")).rejects.toThrow(/fitness_center/);
  });

  it("asks for the 20-result maximum inside the city's equal-area circle, key in the header only", async () => {
    const fetchMock = stubPlaces({
      gym: [],
      fitness_center: [],
      sports_club: [],
      sports_activity_location: [],
    });

    await fetchFitnessLocationSample("Frankfurt", "test-key");

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(url).not.toContain("test-key");
    expect(init.body).not.toContain("test-key");
    expect((init.headers as Record<string, string>)["X-Goog-Api-Key"]).toBe("test-key");
    expect(body.maxResultCount).toBe(20);
    expect(body.locationRestriction.circle.radius).toBe(FITNESS_CITY_CONFIG.Frankfurt.radiusMeters);
  });
});
