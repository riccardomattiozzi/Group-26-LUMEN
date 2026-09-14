"use client";

import { useState } from "react";
import { colors } from "@/lib/theme";
import { FITNESS_CITY_CONFIG, SUPPORTED_FITNESS_CITIES, type SupportedFitnessCity } from "@/lib/fitness/cities";
import { formatLocationCount, unrankedShortReason } from "@/lib/fitness/format";
import { useFitnessOpportunity } from "@/lib/fitness/useFitnessOpportunity";
import type { FitnessOpportunityResponse, FitnessTier } from "@/lib/fitness/types";

// A hand-simplified Germany outline, not a geo-accurate one — the case
// brief explicitly asks the feature to stay a "quiet, no visual noise"
// addition to an existing card, not a full mapping stack. Coordinates are
// an equirectangular projection of each city's real lat/lng (same
// FITNESS_CITY_CONFIG the API route uses) onto a fixed 300x400 viewBox, so
// the pins line up correctly against the drawn border regardless of how
// rough that border is.
const LAT_MIN = 47.0;
const LAT_MAX = 55.2;
const LNG_MIN = 5.5;
const LNG_MAX = 15.3;
const VIEW_W = 300;
const VIEW_H = 400;

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VIEW_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VIEW_H;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

const OUTLINE_POINTS: [number, number][] = [
  [54.85, 9.4], [54.55, 11.2], [54.2, 12.6], [54.0, 13.9], [53.0, 14.6],
  [52.3, 14.6], [51.3, 14.9], [50.7, 14.3], [50.2, 12.5], [48.8, 13.8],
  [47.6, 12.9], [47.4, 11.1], [47.55, 9.6], [47.65, 8.6], [49.0, 8.2],
  [49.6, 6.4], [50.5, 6.0], [51.8, 6.1], [52.9, 7.0], [53.5, 7.0],
  [53.9, 8.6], [54.4, 8.9],
];
const OUTLINE_PATH =
  "M " + OUTLINE_POINTS.map(([lat, lng]) => project(lat, lng).join(",")).join(" L ") + " Z";

const TIER_COLOR: Record<FitnessTier, string> = {
  HIGH: colors.accent,
  MEDIUM: colors.warning,
  LOW: colors.neutral,
};

interface PinProps {
  city: SupportedFitnessCity;
  selected: boolean;
  onToggle: (city: SupportedFitnessCity) => void;
  onHover: (city: SupportedFitnessCity | null) => void;
}

function Pin({ city, selected, onToggle, onHover }: PinProps) {
  const { result } = useFitnessOpportunity(city);
  const config = FITNESS_CITY_CONFIG[city];
  const [x, y] = project(config.lat, config.lng);
  const tier = result?.available && result.ranked ? result.tier : null;
  const color = tier ? TIER_COLOR[tier] : colors.inkFaint;

  return (
    <g
      transform={`translate(${x} ${y})`}
      onMouseEnter={() => onHover(city)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(city)}
      onBlur={() => onHover(null)}
      style={{ cursor: "pointer" }}
    >
      {selected && (
        <circle r="10" fill={color} fillOpacity={0.16} />
      )}
      <circle
        r={selected ? 6 : 5}
        fill={color}
        stroke={colors.surface}
        strokeWidth={selected ? 2 : 1.5}
        role="button"
        tabIndex={0}
        aria-label={`${city}: ${
          tier ? `${tier} fitness opportunity` : result?.available ? "not ranked" : "fitness data unavailable"
        }`}
        onClick={() => onToggle(city)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(city);
          }
        }}
      />
      <text
        y={-11}
        textAnchor="middle"
        fontSize="9.5"
        fontWeight={selected ? 700 : 500}
        fill={selected ? colors.ink : colors.inkSoft}
      >
        {city}
      </text>
    </g>
  );
}

function TooltipContent({ city, result }: { city: SupportedFitnessCity; result: FitnessOpportunityResponse | null }) {
  if (!result) return <>Loading fitness data for {city}…</>;
  if (!result.available) return <>Fitness data unavailable for {city}.</>;
  if (!result.ranked) {
    return (
      <>
        <strong>{city}</strong> — not ranked
        <br />
        {formatLocationCount(result)} locations
        <br />
        {unrankedShortReason(result)}
      </>
    );
  }
  return (
    <>
      <strong>{city}</strong> — {result.tier} opportunity
      <br />
      {result.locationCount} locations · {result.densityPer100k.toFixed(1)} per 100k
      <br />
      {result.opportunityIndex.toFixed(2)}× the {result.comparisonCityCount}-city benchmark
    </>
  );
}

export function FitnessMap({
  selectedRegions,
  onToggle,
}: {
  selectedRegions: string[];
  onToggle: (city: SupportedFitnessCity) => void;
}) {
  const [hovered, setHovered] = useState<SupportedFitnessCity | null>(null);

  // Fixed, unconditional hook calls (never a loop) so the tooltip can read
  // whichever pin is currently hovered without each Pin managing its own
  // popover — same client-cache sharing as the badges in the row list.
  const berlin = useFitnessOpportunity("Berlin");
  const munich = useFitnessOpportunity("Munich");
  const hamburg = useFitnessOpportunity("Hamburg");
  const cologne = useFitnessOpportunity("Cologne");
  const frankfurt = useFitnessOpportunity("Frankfurt");
  const byCity: Record<SupportedFitnessCity, FitnessOpportunityResponse | null> = {
    Berlin: berlin.result,
    Munich: munich.result,
    Hamburg: hamburg.result,
    Cologne: cologne.result,
    Frankfurt: frankfurt.result,
  };
  const anyRanked = SUPPORTED_FITNESS_CITIES.some((c) => {
    const r = byCity[c];
    return r?.available && r.ranked;
  });
  const anyUnranked = SUPPORTED_FITNESS_CITIES.some((c) => {
    const r = byCity[c];
    return r !== null && !(r.available && r.ranked);
  });

  return (
    <div className="relative mt-2 mb-1 rounded-2xl bg-surface-2 p-3">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="mx-auto block h-64 w-full max-w-[220px]"
        role="img"
        aria-label="Map of Germany with a fitness-opportunity pin for each supported city"
      >
        <path d={OUTLINE_PATH} fill="var(--fill)" stroke={colors.line} strokeWidth={1.5} strokeLinejoin="round" />
        {SUPPORTED_FITNESS_CITIES.map((city) => (
          <Pin
            key={city}
            city={city}
            selected={selectedRegions.includes(city)}
            onToggle={onToggle}
            onHover={setHovered}
          />
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-2xs text-foreground-faint">
        {/* Tier keys only mean something once at least one pin carries a tier. */}
        {(anyRanked || !anyUnranked) && (
          <>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.accent }} />
              HIGH
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.warning }} />
              MEDIUM
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.neutral }} />
              LOW
            </span>
          </>
        )}
        {anyUnranked && (
          <span className="inline-flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.inkFaint }} />
            Not ranked
          </span>
        )}
      </div>

      {hovered && (
        <div
          className="chart-tooltip pointer-events-none absolute left-1/2 top-2 w-max max-w-[17rem] -translate-x-1/2 text-center"
          role="status"
        >
          <TooltipContent city={hovered} result={byCity[hovered]} />
        </div>
      )}
    </div>
  );
}
