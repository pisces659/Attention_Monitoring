import Link from "next/link";
import { ArrowRight } from "lucide-react";

import PageHeader from "@/components/dashboard/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { getReports } from "@/services";

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Review AI-generated session reports with attention, speech, and clinical recommendations."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((report) => (
          <Card
            key={report.id}
            className="border-0 shadow-sm ring-1 ring-border/60"
          >
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>
                {report.patientName} • {report.dateLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {report.summary}
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Attention</p>
                  <p className="font-semibold">
                    {formatPercent(report.attentionScore)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Speech</p>
                  <p className="font-semibold">
                    {formatPercent(report.speechScore)}
                  </p>
                </div>
              </div>
              <Link
                href={`/reports/${report.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:underline"
              >
                Open report
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
