import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import TrendChart from "@/components/charts/TrendChart";
import DonutChart from "@/components/charts/DonutChart";
import BarChartCard from "@/components/charts/BarChartCard";
import StatGrid from "@/components/common/StatGrid";
import SessionVideoPlayer from "@/components/common/SessionVideoPlayer";
import PageHeader from "@/components/dashboard/PageHeader";
import PatientProfileHeader from "@/components/patients/PatientProfileHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { getSessionReport } from "@/services";

interface ReportDetailPageProps {
  params: Promise<{ reportId: string }>;
}

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const { reportId } = await params;
  const data = await getSessionReport(reportId);

  if (!data) {
    notFound();
  }

  const {
    report,
    patient,
    attentionMetrics,
    speechMetrics,
    speechWords,
    attentionTimeline,
    blinkTimeline,
    headPoseTimeline,
    focusDistribution,
    recommendations,
  } = data;
  const speechAvailable = Boolean(
    (speechMetrics as { available?: boolean }).available
  );

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild className="px-0">
        <Link href="/reports" className="gap-2">
          <ArrowLeft className="size-4" />
          Back to reports
        </Link>
      </Button>

      <PageHeader
        title={report.title}
        description={`${report.patientName} • ${report.dateLabel}`}
      />

      <PatientProfileHeader patient={patient} />

      <section className="grid gap-6 xl:grid-cols-2">
        <SessionVideoPlayer
          src={data.session.rawVideoUrl}
          title="Original session video"
          fileName={data.session.videoFileName}
        />
        <SessionVideoPlayer
          src={data.session.annotatedVideoUrl}
          fallbackSrc={data.session.rawVideoUrl}
          title="Annotated AI output"
          fileName={data.session.processedVideoFileName}
        />
      </section>

      <StatGrid
        items={[
          {
            label: "Overall attention",
            value: formatPercent(attentionMetrics.overallAttentionPercent),
          },
          ...(speechAvailable
            ? [
                {
                  label: "Speech score",
                  value: formatPercent(speechMetrics.speechScore ?? 0),
                },
              ]
            : []),
          {
            label: "Blink count",
            value: attentionMetrics.blinkCount,
          },
          {
            label: "Screen engagement",
            value: formatPercent(attentionMetrics.screenEngagementPercent),
          },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader>
            <CardTitle>Attention summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Metric label="Focused duration" value={`${attentionMetrics.focusedDurationSeconds}s`} />
            <Metric label="Distracted duration" value={`${attentionMetrics.distractedDurationSeconds}s`} />
            <Metric label="Attention shifts" value={attentionMetrics.attentionShifts} />
            <Metric label="Avg focus duration" value={`${attentionMetrics.averageFocusDurationSeconds}s`} />
            <Metric label="Longest focus" value={`${attentionMetrics.longestFocusDurationSeconds}s`} />
            <Metric label="Avg blink rate" value={`${attentionMetrics.averageBlinkRate}/min`} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader>
            <CardTitle>Speech summary</CardTitle>
            {!speechAvailable ? (
              <CardDescription>
                Speech metrics are not present in the uploaded CSV.
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            {speechAvailable ? (
              <>
                <Metric label="Pronunciation accuracy" value={formatPercent(speechMetrics.pronunciationAccuracy ?? 0)} />
                <Metric label="Completion" value={formatPercent(speechMetrics.completionPercent ?? 0)} />
                <Metric label="Correct words" value={speechMetrics.correctCount ?? 0} />
                <Metric label="Partial words" value={speechMetrics.partialCount ?? 0} />
                <Metric label="Incorrect words" value={speechMetrics.incorrectCount ?? 0} />
                <Metric label="Speech score" value={formatPercent(speechMetrics.speechScore ?? 0)} />
              </>
            ) : (
              <p className="text-muted-foreground sm:col-span-2">
                Upload a CSV that includes speech recognition fields to populate
                this section.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TrendChart
          title="Attention timeline"
          description="Frame-level attention derived from sample-session.csv."
          data={attentionTimeline}
          color="#2563EB"
          chartId="report-attention"
        />
        <BarChartCard
          title="Blink timeline"
          description="Blink events grouped across the session."
          data={blinkTimeline}
          color="#7C3AED"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TrendChart
          title="Head pose timeline"
          description="Average yaw magnitude across session intervals."
          data={headPoseTimeline}
          color="#F59E0B"
          chartId="report-head-pose"
        />
        <DonutChart
          title="Focused vs distracted"
          description="Distribution of attention states."
          data={focusDistribution}
        />
      </section>

      {speechAvailable && speechWords.length > 0 ? (
      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Speech word analysis</CardTitle>
          <CardDescription>
            Expected words matched against detected speech from the session.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Expected</th>
                  <th className="px-4 py-3 font-medium">Detected</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium">Response Time</th>
                  <th className="px-6 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {speechWords.map((word) => (
                  <tr key={`${word.expectedWord}-${word.timestamp}`} className="border-b border-border/60 last:border-b-0">
                    <td className="px-6 py-3">{word.expectedWord}</td>
                    <td className="px-4 py-3">{word.recognizedWord}</td>
                    <td className="px-4 py-3">{Math.round(word.confidence * 100)}%</td>
                    <td className="px-4 py-3 text-muted-foreground">{word.timestamp}</td>
                    <td className="px-6 py-3 capitalize">{word.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(speechMetrics as { otherWords?: { word: string; confidence: number }[] }).otherWords
            ?.length ? (
            <div className="border-t border-border px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Other detected words
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  speechMetrics as { otherWords: { word: string; confidence: number }[] }
                ).otherWords.map((item) => (
                  <span
                    key={item.word}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                  >
                    {item.word} ({item.confidence}%)
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      ) : null}

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm leading-relaxed text-foreground/80">
            {recommendations.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-muted/30 p-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}
