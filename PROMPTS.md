# Prompting notes

The verbatim prompt log for this build is at
`prompts/e264242/session-20260910-212439-lumen.md`. It states openly that it
was written in one pass at the end of the session rather than appended
prompt by prompt — `AGENTS.md`'s automatic logging only fires on Codex, and
this build ran on Claude Code. The prompts themselves are copied exactly as
typed, typos included, and no timestamps were invented to fill the gap.

This file is different: a short note on the one prompting decision that
mattered most for each module, and which tool built it — not a transcript.

## Tooling

All four modules in this build were implemented by Claude Code (Anthropic),
working directly in a cloned copy of this repo on the team lead's machine —
one branch per module, one pull request per branch, reviewed and merged
before the next branch started. The original plan assigned one module per
teammate on their own AI tool of choice; the team instead had Claude Code
execute all four in sequence against the same shared contract. The branch
naming, file-ownership boundaries, and PR-per-module discipline were kept
exactly as if four different people and tools had built it, specifically so
the git history stays legible and reviewable the same way either way.

That describes the four original modules. From pull request #11 onwards the
teammates contributed in their own AI sessions, each logged under their own
student ID — see "Who built what" in the README.

## Core Engine (`feature/core-engine`)

The single most important decision here wasn't a prompt, it was a number we
almost shipped wrong: the first version defaulted `marketShareCapturePct` to
1%, which implies about 629,000 units/month for Germany in year one at the
default scenario — nearly 10× (9.7×) LUMEN's entire current combined
NL+DK+SE volume of about 65,000 units/month. (An earlier version of this
note said ~750,000; rerunning the engine as it was first merged gives
629,121, so the figure is corrected here.) Catching that required
actually running the engine end-to-end and sanity-checking the output
against a real anchor (current home-market volume from
`historical_sales_weekly.csv`), not just checking that the code compiled.
Recalibrated to 0.1%, which lands Germany's year-one estimate in the same
order of magnitude as LUMEN's existing footprint — aggressive, but
explainable.

## Dashboard UI (`feature/dashboard-ui`)

The key call was making the market-share assumption a first-class,
labeled control in the UI rather than a hidden constant — with the channel
mix sliders redistributing proportionally as you drag one, so the three
always visibly sum to 100% instead of silently normalizing after the fact.
Both choices exist so a non-technical viewer can *see* where judgment enters
the model, not just trust a black box.

## Data Visualizations (`feature/data-viz`)

Every chart reads live from the same `computeScenario()` call the KPI row
and the recommendation use — none of them hold a second, static copy of the
numbers. The one addition beyond the original plan was the demand
confidence band on the KPI row and revenue chart: a single point estimate
for a market LUMEN has never sold in reads as false precision, so the range
is shown by default, not hidden behind a toggle.

## Insights Engine (`feature/insights-engine`)

The CFO score went through a real revision, not just a first draft. It
originally scored contribution-margin % directly, which rewards raising
price with no ceiling — margin ratios keep improving even past the point
where total monthly profit collapses from lost volume. Testing the score
against scenarios at both price extremes surfaced that total contribution
profit actually peaks near €2.19, and a margin-ratio-only score couldn't
see that a price was "too high." The score now uses profit relative to
the best achievable at any price/channel combination instead, which is
what actually made the CFO-vs-CMO trade-off in this dataset legible: both
sides prefer the same channels (DTC Online, Gym & Office over
Retail/Grocery, which has the weakest margin of the three everywhere),
and the real tension is specifically about how far to push price past the
profit-maximizing point for the sake of premium positioning.

## Deeper analysis pass (`feature/deeper-analysis`)

An audit of which exhibits the dashboard actually consumed found five sitting
unused: the qualitative verbatims, the raw price-sensitivity responses, the
78 weeks of home-market sales, the cost breakdown and the channel economics.
Building them in changed what the tool says, not just how much it shows:

- The Van Westendorp curves, computed from the 300 raw responses, put
  consumers' own acceptable band at roughly €1.38–€1.97 — materially below
  the profit-maximising €2.19. That disagreement is now displayed rather
  than resolved silently.
- Against each segment's average thresholds, €2.39 prices out Students &
  Budget-Conscious and stretches On-the-go Commuters — together 54% of the
  420 customer-survey respondents. Counted respondent by respondent, 31% of
  the 300 price-sensitivity respondents call €2.39 too expensive. (An
  earlier version of this note described the 54% as per-respondent and
  "outright"; it is segment-level and includes the stretched segment.)
- The unit-economics waterfall makes the channel gap concrete: at €2.39,
  Retail/Grocery keeps €0.74 per can against DTC Online's €1.35, because
  the retailer margin and distributor cut come off the top.

The waterfall is regression-tested against `channel_economics.csv` itself:
rebuilt at that file's own illustrative prices, it must land on that file's
net-price and contribution figures.

## Limitations

- **No real German sales data exists.** Every volume number is an estimate
  built from comparable home markets, German survey data, and competitor
  benchmarks — not a measurement. The `marketShareCapturePct` slider is the
  single largest source of uncertainty in the model; the stress-test panel
  in the Insights section exists specifically so that's never hidden.
- **The demand model doesn't account for a marketing-spend-constrained
  ramp.** `estimatedMonthlyUnits` assumes the addressable demand is
  reachable; it doesn't check whether the chosen `monthlyMarketingBudgetEur`
  is actually sufficient to acquire that many customers at the blended CAC.
  A future pass could cap estimated units by budget ÷ CAC.
- **LTV:CAC (2.80) doesn't vary by scenario** — it's derived purely from
  `marketing_funnel_monthly.csv`, independent of price or channel mix, so it
  functions as a fixed reference point against the brief's ≈3:1 target
  rather than a lever the simulator lets you pull.
- **The CFO/CMO scoring weights are a judgment call**, stated as named
  constants in `lib/recommendationEngine.ts` specifically so they're easy to
  find and argue with, not because they're the only defensible weighting.
