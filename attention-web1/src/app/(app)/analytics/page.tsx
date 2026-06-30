import PageHeader from "@/components/dashboard/PageHeader";
import TrendChart from "@/components/charts/TrendChart";
import DonutChart from "@/components/charts/DonutChart";
import BarChartCard from "@/components/charts/BarChartCard";
import GazeHeatmap from "@/components/charts/GazeHeatmap";
import StatGrid from "@/components/common/StatGrid";
import { formatPercent } from "@/lib/format";
import { getAnalyticsSummary } from "@/services";

export default function AnalyticsPage() {
  const analytics = getAnalyticsSummary();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Deep analytics generated from sample-session.csv and mock speech metrics."
      />

      <StatGrid
        items={[
          {
            label: "Focused time",
            value: `${analytics.focusedTimeSeconds}s`,
          },
          {
            label: "Distracted time",
            value: `${analytics.distractedTimeSeconds}s`,
          },
          {
            label: "Longest focus",
            value: `${analytics.longestFocusDurationSeconds}s`,
          },
          {
            label: "Longest distraction",
            value: `${analytics.longestDistractionDurationSeconds}s`,
          },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <TrendChart
          title="Attention timeline"
          description="Focused attention percentage over time."
          data={analytics.attentionTimeline}
          color="#2563EB"
          chartId="analytics-attention"
        />
        <BarChartCard
          title="Blink timeline"
          description="Blink events across the session."
          data={analytics.blinkTimeline}
          color="#7C3AED"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TrendChart
          title="Head pose timeline"
          description="Average head yaw magnitude over time."
          data={analytics.headPoseTimeline}
          color="#F59E0B"
          chartId="analytics-head-pose"
        />
        <TrendChart
          title="Speech accuracy"
          description="Mock speech accuracy intervals."
          data={analytics.speechAccuracyTimeline}
          color="#22C55E"
          chartId="analytics-speech"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DonutChart
          title="Focused vs distracted"
          description="Attention state distribution."
          data={analytics.focusDistribution}
        />
        <BarChartCard
          title="Blink count"
          description="Cumulative blink count by interval."
          data={analytics.blinkBars}
          color="#2563EB"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <GazeHeatmap
          title="Eye gaze heatmap"
          description="Spatial distribution of horizontal and vertical gaze ratios."
          data={analytics.gazeHeatmap}
        />
        <TrendChart
          title="Word accuracy"
          description="Mock word accuracy trend across the session."
          data={analytics.wordAccuracyTimeline}
          color="#6366F1"
          chartId="analytics-word-accuracy"
        />
      </section>

      <StatGrid
        items={[
          {
            label: "Overall attention",
            value: formatPercent(analytics.metrics.overallAttentionPercent),
          },
          {
            label: "Speech score",
            value: formatPercent(analytics.speechMetrics.speechScore),
          },
          {
            label: "Pronunciation accuracy",
            value: formatPercent(analytics.speechMetrics.pronunciationAccuracy),
          },
          {
            label: "Screen engagement",
            value: formatPercent(analytics.metrics.screenEngagementPercent),
          },
        ]}
      />
    </div>
  );
}
