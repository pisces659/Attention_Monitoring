import AttentionOverTimeChart from "@/components/dashboard/AttentionOverTimeChart";
import DashboardSessionSection from "@/components/dashboard/DashboardSessionSection";
import PatientTimeHistoryHeader from "@/components/dashboard/PatientTimeHistoryHeader";
import SessionHistoryTable from "@/components/dashboard/SessionHistoryTable";
import SummaryMetricCards from "@/components/dashboard/SummaryMetricCards";
import { getPatientTimeHistoryDashboard } from "@/services/patient-dashboard-service";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ patientId?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { patientId } = await searchParams;
  const dashboard = await getPatientTimeHistoryDashboard(patientId);

  return (
    <div className="space-y-6">
      <PatientTimeHistoryHeader
        patient={dashboard.patient}
        dateRangeLabel={dashboard.dateRangeLabel}
      />

      <SummaryMetricCards metrics={dashboard.summaryMetrics} />

      <section
        aria-label="Trends and session history"
        className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
      >
        <AttentionOverTimeChart data={dashboard.attentionOverTime} />
        <SessionHistoryTable sessions={dashboard.sessionHistory} />
      </section>

      <DashboardSessionSection sessions={dashboard.sessionDetails ?? []} />
    </div>
  );
}
