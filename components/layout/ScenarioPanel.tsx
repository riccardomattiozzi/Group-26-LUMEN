"use client";

import { useScenarioStore, PRESET_INPUTS } from "@/lib/store";
import { computeScenario } from "@/lib/engine/pricingEngine";
import { PRESET_COLORS } from "@/lib/theme";
import { rangeStyle } from "@/components/ui/range";
import { formatEuro } from "@/components/charts/format";
import {
  ArrowCounterclockwiseIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from "@/components/ui/icons";
import { InfoTip } from "@/components/ui/InfoTip";
import type { PresetName } from "@/lib/types";

const PRESETS: PresetName[] = ["CFO", "Compromise", "CMO"];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CAPTURE_MIN = 0.0002;
const CAPTURE_MAX = 0.005;
const BUDGET_MIN = 2000;
const BUDGET_MAX = 60000;

// The quickest way in: pick one side of the trade-off, then fine-tune below.
// A checkmark list rather than a segmented control, so each option has room
// for the price and acceptance it would set before you choose it.
export function ScenarioPresets() {
  const activePreset = useScenarioStore((s) => s.activePreset);
  const applyPreset = useScenarioStore((s) => s.applyPreset);
  const resetToDefault = useScenarioStore((s) => s.resetToDefault);
  const isDefault = activePreset === "Compromise";

  return (
    <section className="p-5" aria-labelledby="preset-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="preset-heading" className="eyebrow">
          Scenario
        </h2>
        <div className="flex items-center gap-1.5">
          {activePreset === "Custom" && (
            <span className="rounded-full bg-fill px-2 py-0.5 text-2xs font-medium text-foreground-soft">
              Custom
            </span>
          )}
          <button
            type="button"
            onClick={resetToDefault}
            disabled={isDefault}
            className="pressable inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-footnote font-medium text-accent-ink hover:bg-accent-soft disabled:pointer-events-none disabled:text-foreground-faint disabled:opacity-60"
          >
            <ArrowCounterclockwiseIcon className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-labelledby="preset-heading"
        className="mt-3 overflow-hidden rounded-xl bg-surface-2"
      >
        {PRESETS.map((preset, i) => {
          const outputs = computeScenario(PRESET_INPUTS[preset]);
          const active = activePreset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              aria-label={`${preset} preset: €${PRESET_INPUTS[preset].priceEur.toFixed(2)}, ${outputs.blendedAcceptancePct.toFixed(0)} percent acceptance`}
              aria-pressed={active}
              className="relative flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-fill active:bg-fill-strong focus-visible:rounded-xl focus-visible:outline-offset-[-2px]"
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute left-7 right-0 top-0 h-px bg-line-soft"
                />
              )}
              <span
                aria-hidden
                className="h-2.5 w-2.5 flex-none rounded-full"
                style={{ backgroundColor: PRESET_COLORS[preset] }}
              />
              <span className="flex-1 text-sm font-semibold text-foreground">
                {preset}
              </span>
              <span className="text-xs tabular-nums text-foreground-faint">
                {`€${PRESET_INPUTS[preset].priceEur.toFixed(2)} · ${outputs.blendedAcceptancePct.toFixed(0)}%`}
              </span>
              <span className="w-4 flex-none text-accent-ink">
                {active && <CheckIcon className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function AssumptionControls() {
  const marketShareCapturePct = useScenarioStore(
    (s) => s.inputs.marketShareCapturePct
  );
  const setMarketShareCapturePct = useScenarioStore(
    (s) => s.setMarketShareCapturePct
  );
  const monthlyMarketingBudgetEur = useScenarioStore(
    (s) => s.inputs.monthlyMarketingBudgetEur
  );
  const setMonthlyMarketingBudgetEur = useScenarioStore(
    (s) => s.setMonthlyMarketingBudgetEur
  );
  const launchMonth = useScenarioStore((s) => s.inputs.launchMonth);
  const setLaunchMonth = useScenarioStore((s) => s.setLaunchMonth);
  const includeAdaptogenicCategory = useScenarioStore(
    (s) => s.inputs.includeAdaptogenicCategory
  );
  const setIncludeAdaptogenicCategory = useScenarioStore(
    (s) => s.setIncludeAdaptogenicCategory
  );

  return (
    <section className="space-y-5 p-5" aria-labelledby="market-heading">
      <h2 id="market-heading" className="eyebrow">
        Market &amp; launch
      </h2>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor="capture-slider"
            className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-foreground"
          >
            Year-1 market share
            <InfoTip label="Year-1 market share">
              The share of the addressable German category LUMEN could
              realistically win in its first year. There is no German
              sales history yet, so this is a modeling assumption, not a
              measured result — every figure below depends on it.
            </InfoTip>
            <span className="rounded-full bg-warning-soft px-1.5 py-px text-2xs font-semibold text-warning-ink">
              Assumption
            </span>
          </label>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {(marketShareCapturePct * 100).toFixed(2)}%
          </span>
        </div>
        <input
          id="capture-slider"
          type="range"
          min={CAPTURE_MIN}
          max={CAPTURE_MAX}
          step={0.0001}
          value={marketShareCapturePct}
          onChange={(e) => setMarketShareCapturePct(Number(e.target.value))}
          aria-valuetext={`${(marketShareCapturePct * 100).toFixed(2)} percent`}
          aria-describedby="capture-note"
          style={rangeStyle(marketShareCapturePct, CAPTURE_MIN, CAPTURE_MAX)}
          className="mt-1"
        />
        <p id="capture-note" className="mt-1 text-xs text-foreground-faint text-pretty">
          This is an adjustable assumption, not a measured fact — the % of
          the addressable German category LUMEN could realistically win in
          Year 1. Every number below depends on it; stress-test it before
          trusting a recommendation built on the default.
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="budget-slider" className="text-sm text-foreground">
            Monthly marketing budget
          </label>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatEuro(monthlyMarketingBudgetEur)}
          </span>
        </div>
        <input
          id="budget-slider"
          type="range"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={1000}
          value={monthlyMarketingBudgetEur}
          onChange={(e) => setMonthlyMarketingBudgetEur(Number(e.target.value))}
          aria-valuetext={formatEuro(monthlyMarketingBudgetEur)}
          aria-describedby="budget-note"
          style={rangeStyle(monthlyMarketingBudgetEur, BUDGET_MIN, BUDGET_MAX)}
          className="mt-1"
        />
        {/* The model does not yet cap volume by marketing spend, so moving
            this slider changes no figure on the page — said here, where
            someone would move it, rather than only in PROMPTS.md. The spend
            range is summed per month from marketing_funnel_monthly.csv. */}
        <p id="budget-note" className="mt-1 text-xs text-foreground-faint text-pretty">
          Not used by the estimates yet: the model does not limit volume by
          marketing spend, so moving this changes no figure on the page. The
          €15,000 default is a placeholder, not a number from the case data —
          LUMEN&apos;s recorded spend in marketing_funnel_monthly.csv ran from
          about €40k to €103k a month across its four channels.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label htmlFor="month-select" className="text-sm text-foreground">
          Launch month
        </label>
        {/* A pop-up button: the native <select> for keyboard and screen
            readers, with the chrome drawn to match the other controls. */}
        <div className="relative">
          <select
            id="month-select"
            value={launchMonth}
            onChange={(e) => setLaunchMonth(Number(e.target.value))}
            className="pressable appearance-none rounded-lg bg-fill py-1.5 pl-3 pr-8 text-sm font-medium text-foreground hover:bg-fill-strong"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <ChevronUpDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground-soft" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="adaptogenic-switch" className="text-sm text-foreground text-pretty">
          Include Plant-based / adaptogenic category in market sizing
        </label>
        <span className="switch">
          <input
            id="adaptogenic-switch"
            type="checkbox"
            role="switch"
            checked={includeAdaptogenicCategory}
            onChange={(e) => setIncludeAdaptogenicCategory(e.target.checked)}
          />
          <span aria-hidden className="switch-track" />
          <span aria-hidden className="switch-knob" />
        </span>
      </div>
    </section>
  );
}
