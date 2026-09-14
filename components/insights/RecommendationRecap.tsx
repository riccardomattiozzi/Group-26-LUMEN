"use client";

import { useScenario } from "@/lib/store";
import { computeTradeoff, stressTestAssumption } from "@/lib/recommendationEngine";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatPct } from "@/components/charts/format";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// The close of the page: the same recommendation shown up front under
// "Business impact" (so a viewer who only reads the top of the page still
// gets it), restated here with the full context — trade-off and risk — now
// that the reader has seen the economics, the CFO/CMO framing and the
// stress test. Every figure is read from computeTradeoff() and
// stressTestAssumption(); nothing is a new conclusion.
export function RecommendationRecap() {
  const { inputs, outputs } = useScenario();
  const { recommendation, cfoScore, cmoScore } = computeTradeoff(inputs, outputs);
  const stress = stressTestAssumption(inputs);
  const downside = stress.find((s) => s.multiplier === 0.5)!.result;
  const upside = stress.find((s) => s.multiplier === 2)!.result;

  return (
    <section
      aria-labelledby="recap-heading"
      className="card p-5 sm:p-6"
    >
      <div>
        <SectionHeading id="recap-heading" title="Recommendation summary" />
        <p
          className="max-w-2xl text-lg font-semibold text-foreground text-balance sm:text-xl"
        >
          Based on this scenario, LUMEN should launch at{" "}
          {`€${recommendation.priceEur.toFixed(2)}`}, leading with{" "}
          {recommendation.primaryChannel}, in{" "}
          {MONTH_NAMES[recommendation.launchMonth - 1]}.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 border-t border-line-soft pt-5 sm:grid-cols-3">
          <div>
            <p className="eyebrow">Why</p>
            <p className="mt-1.5 text-sm text-foreground-soft text-pretty">
              {formatPct(outputs.contributionMarginPct)} contribution margin
              and a {outputs.cacPaybackMonths.toFixed(1)}-month CAC payback at
              CFO {cfoScore}/100 vs. CMO {cmoScore}/100 — {timingSummary(recommendation.launchMonth)}.
            </p>
          </div>
          <div>
            <p className="eyebrow">Main trade-off</p>
            <p className="mt-1.5 text-sm text-foreground-soft text-pretty">
              {recommendation.whatWereNotOptimizingFor}
            </p>
          </div>
          <div>
            <p className="eyebrow">Risk to monitor</p>
            <p className="mt-1.5 text-sm text-foreground-soft text-pretty">
              Year-1 market share is an assumption, not a measurement. At
              half the assumption the CFO score drops to {downside.cfoScore}
              /100; at double it, {upside.cfoScore}/100 — the single input
              most worth revisiting if early sales disagree with it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function timingSummary(month: number): string {
  return `launching into ${MONTH_NAMES[month - 1]}'s seasonal demand keeps the mix favorable`;
}
