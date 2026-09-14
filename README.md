# LUMEN — Pricing & Go-to-Market Case — ATELIA × ESCP Starter Kit

> This repo is your starting point. Codex should read this README first.

## How to Get Started

This repo is a **template**: click **Fork** (top right), not "Use this template." Fork keeps your copy linked back to the original — that's what lets ATELIA automatically find every team's work, without anyone needing to send a link.

Once you've forked it, add your teammates as collaborators (Settings → Collaborators on your fork), and leave the visibility as **Public** — don't switch it to Private, or we lose access to your work.

## The Brief

The full brief is in `LUMEN_Case_Brief.md` (and a formatted version in `LUMEN_Case_Brief.pdf`). The data is in the `data/` folder, documented in `data/README_data.md`.

One-sentence summary: LUMEN, a functional beverage brand, has to decide **price, positioning, and launch channel(s)** to enter the German market — with no real German sales data (LUMEN isn't there yet), and a real trade-off between the CMO (premium positioning) and the CFO (fast return on investment).

## Rule #1 — Prompt Logging Is Automatic

This repo includes an `AGENTS.md` file, which Codex reads automatically at the start of every task — you don't need to open or edit it. The first time you talk to Codex in a new conversation, it will ask for your **student ID**. Answer it, and from then on Codex logs every prompt you send it — automatically, verbatim — into `prompts/<your-id>/session-*.md`, without you doing anything else.

**You don't fill this in by hand.** Your only job is to make sure that log file gets committed along with your code changes — Codex writes it, but you still need to include it when your pull request is created and merged. If a pull request only has code changes and no updated log file, that's a sign something didn't get logged.

Why we're doing this: it's not to monitor you. It's what lets us understand, at the end, how you reasoned — not just what you produced. A good result reached with a clear prompt from the start isn't scored the same as a good result reached after fifteen random attempts.

## Rule #2 — Before You Code, Ask Yourself These Questions

Check each box in this README as you go — not at the end, while you're working:

- [x] **Data**: `customer_survey.csv`'s `first_name`/`last_name`/`email` are stripped by `scripts/build-data.ts` before anything is written to `data/processed/` — the deployed app never receives them. Everything it does use (segment, city, spend, awareness, intent) is anonymized aggregate or individually non-identifying. Full answer in-app under "README checklist" (`components/insights/ChecklistPanel.tsx`).
- [x] **API keys**: `app/api/fitness-opportunity` calls the Google Places API (New) server-side for the Fitness Opportunity signal; `GOOGLE_MAPS_API_KEY` is read only in that route handler via `process.env`, stored in `.env.local` (gitignored) / Vercel Environment Variables, and never reaches the browser.
- [x] **Deployment**: almost the whole app is still static — the browser receives the pre-built, PII-free JSON under `data/processed/` for everything else. The one API route returns only aggregate fitness-location counts and computed ratios for a supported city, never raw Places API data.
- [x] **Files generated along the way**: `data/processed/*.json` and `data/processed/DATA_QUALITY.md` are committed on purpose — they're the reproducible, PII-free artifact the deployed app reads and its audit trail, not scratch output.
- [x] **Storage**: no database, no persistence — every number is recomputed live from `ScenarioInputs` via a pure function. Nothing needs to be shared between visitors or remembered between visits.
- [x] **Robustness**: empty regions → zero demand, not `NaN`; a channel mix that doesn't sum to 1 is normalized, not rejected; price is clamped; zero marketing budget doesn't divide-by-zero. Covered by tests in `lib/engine/pricingEngine.test.ts` and `lib/recommendationEngine.test.ts`.
- [x] **Explainability**: the recommendation box states price, channel, timing and the trade-off in one plain paragraph with real numbers. The market-share assumption is labeled explicitly as an assumption, and a "does this hold up?" panel stress-tests it.
- [x] **Business relevance**: answers the brief's exact closing question (price, channel(s), timing, what's deliberately not optimized for), with every number traceable to a specific CSV column, and flags where the model extrapolates beyond the €1.79–€2.59 range LUMEN actually tested.

These questions aren't here to slow you down — they're part of what's being evaluated. A thoughtful answer to one of them is worth more than an extra feature nobody asked for.

## What We Expect at the End

- A prototype that works, even partially, on the LUMEN case
- Your prompt log (`prompts/<your-id>/session-*.md`) committed and up to date
- A short paragraph below, written in business language (not technical), explaining what you did and why
- A live URL (Vercel or similar) if you deployed it — not required to still get credit, but expected if you did

## Our Approach

**Live**: https://lumen-pricing-case-template-nine.vercel.app

We built a simulator, not a single answer, because the honest answer to "what price should LUMEN launch at in Germany" depends on how much you weight Elena's runway against Jonas's brand ambitions — and we didn't think that call was ours to make silently inside a spreadsheet. Move any slider (price, channel mix, launch month, or the one genuinely uncertain number in this whole model — how much of the German market LUMEN could realistically win in year one) and every number on the page recomputes live from the real data room: no hidden Excel tab, no rounding "for simplicity."

One finding surprised us enough that it changed the tool. Our first instinct — like most people's — was that a cheap price sold through mass retail would be the CFO-friendly choice, fast payback, wide reach. Running the actual unit economics said the opposite: Retail/Grocery has the weakest margin of LUMEN's three channels at every price point once the retailer's cut and distributor fee are removed, and total monthly profit actually peaks around €2.19 — both the €1.79 and €2.59 ends of the tested range leave money on the table, just for different reasons (too little margin per can vs. too few people buying). So the real trade-off in this data isn't "cheap vs. premium." Both a finance-first and a brand-first reading of the numbers agree on the channels (DTC Online and Gym & Office, not mass retail); they disagree specifically on how far to push price toward premium positioning once profit has already peaked — and on how much reach to sacrifice by avoiding retail almost entirely.

The tool also refuses to resolve a disagreement that genuinely exists in the data. Run the Van Westendorp analysis on the 300 raw price-sensitivity responses and German consumers put their own acceptable range at roughly €1.38–€1.97, with an optimal point near €1.55 — well below the €2.19 where total profit actually peaks. We show both, side by side, rather than quietly picking the one that supports the recommendation. Stated willingness-to-pay reliably skews low, and a premium price is a deliberate decision to sell to fewer people at a better margin; but anyone approving this plan should see what €2.39 gives up. Measured against each segment's average price thresholds, it is above the "too expensive" line for Students & Budget-Conscious (32% of the 420 customer-survey respondents) and above the "expensive" line for On-the-go Commuters (21%), so 54% of the surveyed market is either priced out or stretched. Counted respondent by respondent instead, 31% of the 300 price-sensitivity respondents call €2.39 too expensive. The verbatims from those two segments are also harsher than their survey scores suggest.

Because there's no real German sales history — LUMEN has never sold there — every volume estimate rests on one assumption we refused to bury: what share of the addressable category LUMEN could win in its first year. We made that a slider, not a footnote, and we built a one-click stress test that reruns the entire recommendation at half and double that assumption, so a viewer can see for themselves whether a given price/channel call survives a more conservative guess or only looks good at the default. Where the model has no direct evidence — any price outside the €1.79–€2.59 band actually tested — it says so visibly rather than presenting a guess with the same confidence as a measurement.

## Who built what

Every change reached `main` through a pull request, and each student's prompts are logged under their own ID in `prompts/<student-id>/`.

| GitHub account · student ID | Pull requests | Contribution |
|---|---|---|
| riccardomattiozzi · e264242 | #1–#10 | Pricing engine and data pipeline, input dashboard, charts, recommendation and CFO/CMO scoring, the twelve-exhibit analysis, the Apple-style redesign, the Compromise preset fix |
| Tommasolanfranchi22 · e263018 | #11, #16 | UI polish (tooltips, recommendation card, trade-off spectrum); Nordic redesign and the 01–07 guided decision journey |
| Arno-Teillon · e255640 | #12–#15 | Weather–sales demand module (`lib/weather`), trade-off spectrum label fix |
| Davidelupo1927 · e263627 | #17–#20 | Fitness Opportunity signal (Google Places, server-side) and the interactive Germany map |

**A note on commit authorship.** The team worked from one shared laptop, signing in to GitHub one person at a time. The git commit-author setting was not switched back after Arno-Teillon's session, so the commits inside #16 (Tommasolanfranchi22) and #17–#20 (Davidelupo1927) carry Arno-Teillon's name and e-mail. The account that opened each pull request and the prompt log under each student's ID are the accurate record of who did the work.
