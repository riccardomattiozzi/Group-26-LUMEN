"use client";

import { useScenario } from "@/lib/store";
import { computeTradeoff, recommendLaunchMonth } from "@/lib/recommendationEngine";
import { formatPct, formatUnits } from "@/components/charts/format";
import { CheckIcon } from "@/components/ui/icons";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// The page's one headline: the call in a single sentence, then the three
// decisions (price, channel, month) as scannable figures underneath. "Why"
// and the trade-off are both built from the same numbers already computed
// by lib/recommendationEngine.ts — nothing here invents a conclusion.
export function RecommendationBox() {
  const { inputs, outputs } = useScenario();
  const { recommendation, cfoScore, cmoScore, tradeoffGapPts } = computeTradeoff(inputs, outputs);
  const timing = recommendLaunchMonth();
  const channelSharePct = Math.round(inputs.salesChannelMix[recommendation.primaryChannel] * 100);

  const reasons = [
    `${formatPct(outputs.contributionMarginPct)} contribution margin with a ${outputs.cacPaybackMonths.toFixed(1)}-month CAC payback (LTV:CAC ${outputs.ltvToCacRatio.toFixed(2)}).`,
    `${recommendation.primaryChannel} leads the mix at ${channelSharePct}%, driving an estimated ${formatUnits(outputs.estimatedMonthlyUnits)} units/month.`,
    timing.rationale,
  ];

  return (
    <section
      aria-labelledby="recommendation-heading"
      className="card p-5 sm:p-6"
    >
      <div>
        <p className="eyebrow">Recommendation for this scenario</p>
        <h2
          id="recommendation-heading"
          className="mt-1.5 max-w-3xl text-xl font-semibold text-foreground text-balance @xl:text-2xl"
        >
          Launch at {`€${recommendation.priceEur.toFixed(2)}`}, leading with{" "}
          {recommendation.primaryChannel}, targeting{" "}
          {MONTH_NAMES[recommendation.launchMonth - 1]}.
        </h2>

        {/* Price / channel / when as their own figures — the same three
            decisions as the headline, readable at a glance. */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-line-soft rounded-lg bg-surface-2 py-3 @xl:max-w-xl [&>div]:px-4">
          <div>
            <p className="eyebrow">Price</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {`€${recommendation.priceEur.toFixed(2)}`}
            </p>
          </div>
          <div>
            <p className="eyebrow">Lead channel</p>
            <p className="mt-1 text-lg font-semibold text-foreground text-balance">
              {recommendation.primaryChannel}
            </p>
          </div>
          <div>
            <p className="eyebrow">Launch</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {MONTH_NAMES[recommendation.launchMonth - 1].slice(0, 3)}
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-2xl">
          <h3 className="eyebrow">Why</h3>
          <ul className="mt-2 space-y-1.5">
            {reasons.map((reason, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground-soft text-pretty">
                <CheckIcon className="mt-0.5 h-3.5 w-3.5 flex-none text-accent-ink" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 max-w-3xl text-xs text-foreground-faint">
          CFO score {cfoScore}/100 · CMO score {cmoScore}/100 · {tradeoffGapPts}-pt gap
        </p>

        <div className="mt-6 max-w-3xl border-t border-line-soft pt-5">
          <h3 className="eyebrow">Main trade-off — what this deliberately doesn&apos;t optimize for</h3>
          <p className="mt-1.5 text-sm text-foreground-soft text-pretty">
            {recommendation.whatWereNotOptimizingFor}
          </p>
        </div>
      </div>
    </section>
  );
}
