import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import TrendChart from "@/components/charts/TrendChart";
import PatientProfileHeader from "@/components/patients/PatientProfileHeader";
import PatientSessionList from "@/components/patients/PatientSessionList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPercent } from "@/lib/format";
import {
  getAnalyticsSummary,
  getPatientById,
  getReportsByPatientId,
  getSessionsByPatientId,
} from "@/services";

interface PatientProfilePageProps {
  params: Promise<{ patientId: string }>;
}

export default async function PatientProfilePage({
  params,
}: PatientProfilePageProps) {
  const { patientId } = await params;
  const patient = await getPatientById(patientId);

  if (!patient) {
    notFound();
  }

  const sessions = await getSessionsByPatientId(patientId);
  const reports = await getReportsByPatientId(patientId);
  const analytics = await getAnalyticsSummary();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="px-0">
        <Link href="/patients" className="gap-2">
          <ArrowLeft className="size-4" />
          Back to patients
        </Link>
      </Button>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="bg-[#0052CC] hover:bg-[#0047B3]">
          <Link href={`/dashboard?patientId=${patientId}`}>
            Patient Time History
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/sessions/new?patientId=${patientId}`}>New session</Link>
        </Button>
      </div>

      <PatientProfileHeader patient={patient} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notes">Doctor notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <OverviewCard label="Average attention" value={formatPercent(patient.averageAttention)} />
            <OverviewCard label="Average speech" value={formatPercent(patient.averageSpeech)} />
            <OverviewCard label="Total sessions" value={patient.sessionCount} />
          </div>
          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardHeader>
              <CardTitle>Clinical summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-foreground/80">
              {patient.notes}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <PatientSessionList sessions={sessions} />
        </TabsContent>

        <TabsContent value="reports" className="grid gap-4 lg:grid-cols-2">
          {reports.length === 0 ? (
            <Card className="border-0 shadow-sm ring-1 ring-border/60">
              <CardContent className="py-8 text-sm text-muted-foreground">
                No reports available for this patient yet.
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="border-0 shadow-sm ring-1 ring-border/60">
                <CardHeader>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.dateLabel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{report.summary}</p>
                  <Link
                    href={`/reports/${report.id}`}
                    className="text-sm font-medium text-[#2563EB] hover:underline"
                  >
                    Open report
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <TrendChart
            title="Attention history"
            description="Sample attention timeline linked to CSV analytics."
            data={analytics.attentionTimeline}
            color="#2563EB"
            chartId={`patient-${patient.id}-attention`}
          />
        </TabsContent>

        <TabsContent value="notes">
          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardHeader>
              <CardTitle>Doctor notes</CardTitle>
              <CardDescription>
                Clinical observations and care plan notes for this patient.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/80">
              <p>{patient.notes}</p>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="font-medium text-foreground">Care plan focus</p>
                <p className="mt-2 text-muted-foreground">
                  Continue monitoring attention stability during structured tasks
                  and review speech clarity trends every two sessions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/60">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 font-heading text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
