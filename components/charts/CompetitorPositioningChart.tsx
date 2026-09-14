"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useScenario } from "@/lib/store";
import { dataset, COMPETITORS } from "@/lib/engine/dataset";
import { colors } from "@/lib/theme";
import { formatEuro } from "./format";
import {
  ChartLegend,
  ChartTooltip,
  cursorBand,
  refLabel,
  xAxisProps,
  yAxisProps,
} from "./chartKit";
import type { LumenDataset } from "@/lib/engine/dataset";

// Real price bands (min-max across every channel/format LUMEN's data room
// has for that competitor) — never invented, always derived from
// data/competitor_prices_by_channel.csv.
export function buildPositioningSeries(ds: LumenDataset = dataset) {
  return COMPETITORS.map((competitor) => {
    const rows = ds.competitorPricesByChannel.filter(
      (r) => r.competitor === competitor
    );
    const prices = rows.map((r) => r.priceEur);
    return {
      competitor,
      positioning: rows[0]?.positioning ?? "",
      range: [Math.min(...prices), Math.max(...prices)] as [number, number],
    };
  });
}

// Emphasis, not a rainbow: competitor bands recede in gray capsules and
// LUMEN is the one colored mark on the chart.
export function CompetitorPositioningChart() {
  const { inputs } = useScenario();
  const data = buildPositioningSeries();
  const maxDomain = Math.ceil((Math.max(3.29, ...data.map((d) => d.range[1])) + 0.2) * 2) / 2;
  const ticks = Array.from({ length: Math.round(maxDomain * 2) + 1 }, (_, i) => i / 2);

  return (
    <div className="card p-5">
      <h3 className="card-title">LUMEN vs. competitor price bands</h3>
      <p className="card-subtitle">
        Real price ranges across channel/format from the data room, current
        LUMEN price marked in blue.
      </p>
      <div
        className="mt-4 h-56"
        role="img"
        aria-label={`LUMEN priced at ${formatEuro(inputs.priceEur, 2)}. ${data
          .map(
            (d) =>
              `${d.competitor} (${d.positioning}): ${formatEuro(d.range[0], 2)}–${formatEuro(d.range[1], 2)}`
          )
          .join("; ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 24, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={colors.grid} horizontal={false} />
            <XAxis
              {...xAxisProps}
              type="number"
              domain={[0, maxDomain]}
              ticks={ticks}
              tickFormatter={(v) => `€${v.toFixed(2)}`}
              minTickGap={8}
            />
            <YAxis
              {...yAxisProps}
              type="category"
              dataKey="competitor"
              width={88}
              tick={{ fill: colors.inkSoft, fontSize: 12 }}
            />
            <Tooltip
              cursor={cursorBand}
              isAnimationActive={false}
              content={(p) => (
                <ChartTooltip
                  active={p.active}
                  payload={p.payload}
                  label={p.label}
                  valueFormatter={(value) => {
                    const [min, max] = value as [number, number];
                    return [`${formatEuro(min, 2)}–${formatEuro(max, 2)}`, "price range"];
                  }}
                />
              )}
            />
            <Bar
              dataKey="range"
              fill={colors.neutral}
              radius={6}
              barSize={12}
              isAnimationActive={false}
            />
            <ReferenceLine
              x={inputs.priceEur}
              stroke={colors.accent}
              strokeWidth={2}
              label={refLabel(`LUMEN ${formatEuro(inputs.priceEur, 2)}`)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: "Competitor price range", color: colors.neutral, shape: "rect" },
          { label: "LUMEN current price", color: colors.accent, shape: "line" },
        ]}
      />
    </div>
  );
}
