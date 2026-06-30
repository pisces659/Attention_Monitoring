import MetricCard from "@/components/dashboard/MetricCard";
import PageHeader from "@/components/dashboard/PageHeader";
import PerformanceOverview from "@/components/dashboard/PerformanceOverview";
import RecentPatientsPanel from "@/components/dashboard/RecentPatientsPanel";
import RecentSessionsPanel from "@/components/dashboard/RecentSessionsPanel";
import TrendChart from "@/components/charts/TrendChart";
import { currentClinician } from "@/mock";
import { getDashboardSummary } from "@/services";

export default function DashboardPage() {
  const summary = getDashboardSummary();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${currentClinician.name}. Here is your clinical overview for today.`}
      />

      <section
        aria-label="Key metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      >
        {summary.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section
        aria-label="Trend charts"
        className="grid gap-6 xl:grid-cols-2"
      >
        <TrendChart
          title="Attention Trend"
          description="Focused attention percentage derived from sample-session.csv."
          data={summary.attentionTrend}
          color="#2563EB"
          chartId="attention"
        />
        <TrendChart
          title="Speech Accuracy"
          description="Speech accuracy across recent completed sessions."
          data={summary.speechTrend}
          color="#7C3AED"
          chartId="speech"
        />
      </section>

      <section
        aria-label="Performance and recent activity"
        className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"
      >
        <div className="space-y-6">
          <PerformanceOverview
            attentionAverage={summary.weeklyAttentionAverage}
            speechAverage={summary.weeklySpeechAverage}
          />
          <RecentPatientsPanel patients={summary.recentPatients} />
        </div>
        <RecentSessionsPanel sessions={summary.recentSessions} />
      </section>
    </div>
  );
}
