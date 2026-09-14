"use client";

import { useScenario, useScenarioStore } from "@/lib/store";
import { dataset, REGIONS } from "@/lib/engine/dataset";
import { formatEuro } from "@/components/charts/format";
import { CheckIcon, WarningIcon } from "@/components/ui/icons";
import { InfoTip } from "@/components/ui/InfoTip";
import { FitnessMap } from "@/components/analysis/FitnessMap";
import { SUPPORTED_FITNESS_CITIES, isSupportedFitnessCity } from "@/lib/fitness/cities";
import { formatLocationCount, unrankedExplanation } from "@/lib/fitness/format";
import { useFitnessOpportunity } from "@/lib/fitness/useFitnessOpportunity";
import type { FitnessOpportunityResponse, FitnessTier } from "@/lib/fitness/types";
import type { Region } from "@/lib/types";

const FITNESS_TIER_STYLE: Record<FitnessTier, string> = {
  HIGH: "bg-accent-soft text-accent-ink",
  MEDIUM: "bg-warning-soft text-warning-ink",
  LOW: "bg-fill text-foreground-soft",
};

type AvailableFitness = Extract<FitnessOpportunityResponse, { available: true }>;

// One badge per row, each with its own hook call — Rules of Hooks means
// this can't live inline inside the row-rendering .map() below.
function FitnessBadge({ region }: { region: Region }) {
  const city = isSupportedFitnessCity(region) ? region : null;
  const { result } = useFitnessOpportunity(city);

  if (!city) {
    return <span className="text-2xs text-foreground-faint">Fitness data n/a</span>;
  }
  if (!result) {
    return <span className="text-2xs text-foreground-faint">Fitness data loading…</span>;
  }
  if (!result.available) {
    return <span className="text-2xs text-foreground-faint">Fitness data unavailable</span>;
  }
  if (!result.ranked) {
    return (
      <span className="text-2xs text-foreground-faint" title={unrankedExplanation(result)}>
        {formatLocationCount(result)} fitness locations · not ranked
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${FITNESS_TIER_STYLE[result.tier]}`}
      title={`${result.locationCount} fitness locations · ${result.densityPer100k.toFixed(1)} per 100k · ${result.opportunityIndex.toFixed(2)}x opportunity index`}
    >
      {result.opportunityIndex.toFixed(2)}x fitness · {result.tier}
    </span>
  );
}

// A fixed, unconditional set of hook calls (one per supported city, never a
// loop over a dynamic array) so this stays valid under the Rules of Hooks.
// Piggybacks on the same client-side cache as the per-row FitnessBadge
// instances above, so it never causes an extra Places API round trip.
//
// Either says why cities aren't ranked (a capped count anywhere) or, only
// when every count is complete, names the strongest selected city.
function FitnessInsight({ selectedRegions }: { selectedRegions: Region[] }) {
  const berlin = useFitnessOpportunity("Berlin");
  const munich = useFitnessOpportunity("Munich");
  const hamburg = useFitnessOpportunity("Hamburg");
  const cologne = useFitnessOpportunity("Cologne");
  const frankfurt = useFitnessOpportunity("Frankfurt");

  const byCity = {
    Berlin: berlin.result,
    Munich: munich.result,
    Hamburg: hamburg.result,
    Cologne: cologne.result,
    Frankfurt: frankfurt.result,
  } as const;

  const available = SUPPORTED_FITNESS_CITIES.map((c) => byCity[c]).filter(
    (r): r is AvailableFitness => Boolean(r?.available)
  );

  const cappedCities = SUPPORTED_FITNESS_CITIES.filter((c) =>
    available.some((r) => r.cappedCities.includes(c))
  );
  if (cappedCities.length > 0) {
    const { maxResultsPerSearch } = available[0];
    return (
      <p className="callout callout-warning mt-3 flex gap-2">
        <WarningIcon className="mt-0.5 h-3.5 w-3.5 flex-none text-warning" />
        <span>
          <strong>Cities are not ranked on fitness density.</strong> Google
          Places returns at most {maxResultsPerSearch} results per search, and
          the counts for {cappedCities.join(", ")} hit that limit. A capped
          count is only a lower bound: divided by population, capped counts
          would rank cities by size, not by how many fitness locations they
          have.
        </span>
      </p>
    );
  }

  const topSelected = available
    .filter((r) => selectedRegions.includes(r.city))
    .flatMap((r) => (r.ranked ? [r] : []))
    .sort((a, b) => b.opportunityIndex - a.opportunityIndex)[0];

  if (!topSelected || topSelected.tier !== "HIGH") return null;

  return (
    <p className="callout mt-3">
      <strong>{topSelected.city}</strong> has an above-average fitness-location
      density (opportunity index {topSelected.opportunityIndex.toFixed(2)}× the
      average of the {topSelected.comparisonCityCount} cities compared),
      supporting its attractiveness as an initial target market — a
      directional market signal, not a demand forecast.
    </p>
  );
}

export function RegionalOpportunity() {
  const { inputs } = useScenario();
  const setTargetRegions = useScenarioStore((s) => s.setTargetRegions);

  const categoryEur = dataset.marketContext
    .filter(
      (r) =>
        r.dimensionType === "subcategory" &&
        r.metric === "market_size_eur" &&
        r.year === 2026 &&
        (r.name === "Energy / focus" ||
          (inputs.includeAdaptogenicCategory && r.name === "Plant-based / adaptogenic"))
    )
    .reduce((s, r) => s + r.value, 0);

  const rows = REGIONS.map((region) => {
    const share =
      dataset.marketContext.find(
        (r) =>
          r.dimensionType === "region" &&
          r.name === region &&
          r.metric === "population_share_of_market"
      )?.value ?? 0;
    const cagr =
      dataset.marketContext.find(
        (r) =>
          r.dimensionType === "region" &&
          r.name === region &&
          r.metric === "regional_cagr"
      )?.value ?? 0;
    return {
      region,
      share,
      cagr,
      valueEur: categoryEur * share,
      selected: inputs.targetRegions.includes(region),
    };
  }).sort((a, b) => b.valueEur - a.valueEur);

  const maxValue = Math.max(...rows.map((r) => r.valueEur), 1);
  const selectedValue = rows
    .filter((r) => r.selected)
    .reduce((s, r) => s + r.valueEur, 0);

  function toggle(region: Region) {
    setTargetRegions(
      inputs.targetRegions.includes(region)
        ? inputs.targetRegions.filter((r) => r !== region)
        : [...inputs.targetRegions, region]
    );
  }

  return (
    <div className="card p-5">
      <h3 className="card-title flex items-center gap-1">
        Where the German category value sits
        <InfoTip label="Fitness Opportunity">
          Fitness Opportunity Index is a directional proxy based on
          fitness-location density (gyms, fitness centers, sports clubs and
          activity locations per 100k inhabitants, relative to the average
          across the five supported cities). It is not an estimate of the
          percentage of residents who exercise. Locations come from Google
          Places in a circle the size of each city&apos;s area; populations are
          Destatis figures for 31 Dec 2024. Google returns at most 20 places
          per search, so a search that comes back full gives only a lower
          bound. Cities are not ranked while any count is capped.
        </InfoTip>
      </h3>
      <p className="card-subtitle">
        2026 category value split by region, with each region&apos;s own growth
        rate and fitness-location density as a market-opportunity signal.
        Click a row (or a pin) to add or remove it from the launch footprint.
      </p>

      <FitnessMap selectedRegions={inputs.targetRegions} onToggle={toggle} />

      {/* Selectable rows with a selection circle, as in a list in edit mode. */}
      <div className="-mx-2 mt-4 space-y-0.5">
        {rows.map((row) => (
          <button
            key={row.region}
            type="button"
            onClick={() => toggle(row.region)}
            aria-pressed={row.selected}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-2 active:bg-fill"
          >
            <span
              aria-hidden
              className={`flex h-5 w-5 flex-none items-center justify-center rounded-full transition-colors ${
                row.selected
                  ? "bg-accent text-white"
                  : "border-[1.5px] border-foreground-faint/50"
              }`}
            >
              {row.selected && <CheckIcon className="h-3 w-3" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2 text-xs">
                <span
                  className={`text-sm ${
                    row.selected ? "font-medium text-foreground" : "text-foreground-soft"
                  }`}
                >
                  {row.region}
                </span>
                <span className="tabular-nums text-foreground-faint">
                  {formatEuro(row.valueEur)} · {(row.cagr * 100).toFixed(0)}% CAGR
                </span>
              </span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-fill">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(row.valueEur / maxValue) * 100}%`,
                    backgroundColor: row.selected ? "var(--accent)" : "var(--chart-neutral)",
                  }}
                />
              </span>
              <span className="mt-1.5 flex justify-end">
                <FitnessBadge region={row.region} />
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="callout mt-4">
        Selected footprint covers{" "}
        <strong>{formatEuro(selectedValue)}</strong> of
        2026 category value ({((selectedValue / (categoryEur || 1)) * 100).toFixed(0)}%
        of the country). Berlin and Munich carry the faster 9% growth rate; the
        &quot;Other Germany&quot; block is 40% of the value but the hardest to
        service from a standing start.
      </p>
      <FitnessInsight selectedRegions={inputs.targetRegions} />
    </div>
  );
}
