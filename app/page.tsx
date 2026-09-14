import { Navbar } from "@/components/layout/Navbar";
import { ScenarioPresets, AssumptionControls } from "@/components/layout/ScenarioPanel";
import { PriceSlider } from "@/components/layout/PriceSlider";
import { ChannelMixSliders } from "@/components/layout/ChannelMixSliders";
import { RegionSelect } from "@/components/layout/RegionSelect";
import { Tabs, TabPanel } from "@/components/layout/Tabs";

import { DecisionFraming } from "@/components/insights/DecisionFraming";
import { RecommendationBox } from "@/components/insights/RecommendationBox";
import { TradeoffMatrix } from "@/components/insights/TradeoffMatrix";
import { StressTest } from "@/components/insights/StressTest";
import { ScenarioComparison } from "@/components/insights/ScenarioComparison";
import { RecommendationRecap } from "@/components/insights/RecommendationRecap";
import { ChecklistPanel } from "@/components/insights/ChecklistPanel";

import { KpiRow } from "@/components/charts/KpiRow";
import { RevenueMarginChart } from "@/components/charts/RevenueMarginChart";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { ChannelContributionChart } from "@/components/charts/ChannelContributionChart";
import { CompetitorPositioningChart } from "@/components/charts/CompetitorPositioningChart";
import { CompetitorPriceHistoryChart } from "@/components/charts/CompetitorPriceHistoryChart";

import { VanWestendorpChart } from "@/components/analysis/VanWestendorpChart";
import { UnitEconomicsPanel } from "@/components/analysis/UnitEconomicsPanel";
import { SegmentPanel } from "@/components/analysis/SegmentPanel";
import { SeasonalityChart } from "@/components/analysis/SeasonalityChart";
import { RegionalOpportunity } from "@/components/analysis/RegionalOpportunity";
import { HomeMarketBenchmark } from "@/components/analysis/HomeMarketBenchmark";
import { DataProvenance } from "@/components/analysis/DataProvenance";

import { SectionHeading } from "@/components/ui/SectionHeading";

const TABS = [
  { id: "price", label: "Price", hint: "What happens as price changes?" },
  { id: "customers", label: "Customers", hint: "What does demand look like?" },
  { id: "channels", label: "Channels", hint: "Where should we distribute?" },
  { id: "timing", label: "Timing & regions", hint: "When and where should we launch?" },
  { id: "method", label: "Method", hint: "What supports this model?" },
];

export default function Home() {
  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl space-y-7 px-4 pb-16 sm:px-6 lg:px-8">
        {/* The decision this screen supports, before any control or number. */}
        <DecisionFraming />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[17.5rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-8">
          {/* Scenario inputs. Sticky on wide screens so the controls and
              the numbers they move stay on screen together through every
              later section. */}
          <aside
            aria-label="Scenario assumptions"
            className="h-fit overscroll-contain md:sticky md:top-[calc(var(--nav-h)+1rem)] md:max-h-[calc(100dvh-var(--nav-h)-2rem)] md:overflow-y-auto"
          >
            <SectionHeading title="Scenario inputs" />
            <div className="card inspector">
              <ScenarioPresets />
              <PriceSlider />
              <ChannelMixSliders />
              <RegionSelect />
              <AssumptionControls />
            </div>
          </aside>

          <div className="@container min-w-0 space-y-8">
            {/* Business impact. */}
            <div className="space-y-5">
              <SectionHeading title="Business impact" />
              <RecommendationBox />
              <KpiRow />
            </div>

            {/* The CFO/CMO trade-off. */}
            <div className="space-y-5">
              <SectionHeading title="Strategic trade-off" />
              <TradeoffMatrix />
            </div>

            {/* Stress test. Supporting evidence, not the headline. */}
            <div className="space-y-5">
              <SectionHeading title="Stress test" />
              <StressTest />
              <ScenarioComparison />
            </div>

            {/* Evidence: detailed analysis, tabbed so it stays out of the
                way until someone asks for it. */}
            <div className="space-y-5">
              <SectionHeading title="Evidence" />
              <Tabs tabs={TABS}>
                <TabPanel id="price">
                  <VanWestendorpChart />
                  <RevenueMarginChart />
                  <CompetitorPositioningChart />
                  <CompetitorPriceHistoryChart />
                </TabPanel>

                <TabPanel id="customers">
                  <SegmentPanel />
                </TabPanel>

                <TabPanel id="channels">
                  <UnitEconomicsPanel />
                  <div className="grid grid-cols-1 items-start gap-5 @3xl:grid-cols-2">
                    <VolumeChart />
                    <ChannelContributionChart />
                  </div>
                </TabPanel>

                <TabPanel id="timing">
                  <SeasonalityChart />
                  <div className="grid grid-cols-1 items-start gap-5 @3xl:grid-cols-2">
                    <RegionalOpportunity />
                    <HomeMarketBenchmark />
                  </div>
                </TabPanel>

                <TabPanel id="method">
                  <DataProvenance />
                  <ChecklistPanel />
                </TabPanel>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Recommendation summary: the close of the page. */}
        <RecommendationRecap />
      </main>
    </div>
  );
}
