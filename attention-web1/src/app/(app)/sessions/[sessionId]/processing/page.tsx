"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { USE_API } from "@/lib/api-config";
import type { Session } from "@/types";
import { fetchSession } from "@/services/session-upload-service";

const steps = [
  "Uploading video",
  "Detecting face landmarks",
  "Tracking gaze and blinks",
  "Generating annotated video",
  "Building CSV metrics and report",
];

export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">
          Loading processing status...
        </div>
      }
    >
      <ProcessingContent />
    </Suspense>
  );
}

function ProcessingContent() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId;
  const reportIdParam = searchParams.get("reportId");
  const patientId = searchParams.get("patientId");

  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState(8);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");

  const reportId = session?.reportId || reportIdParam;
  const reportHref =
    USE_API && reportId ? `/reports/${reportId}` : "/reports/rep-001";
  const dashboardHref = patientId
    ? `/dashboard?patientId=${encodeURIComponent(patientId)}`
    : "/dashboard";

  const complete =
    session?.status === "completed" ||
    (!USE_API && progress >= 100);
  const failed = session?.status === "failed";

  useEffect(() => {
    if (!USE_API || !sessionId) {
      const interval = window.setInterval(() => {
        setProgress((current) => {
          const next = Math.min(current + 12, 100);
          setStepIndex(Math.min(steps.length - 1, Math.floor(next / 20)));
          return next;
        });
      }, 700);
      return () => window.clearInterval(interval);
    }

    let cancelled = false;

    async function poll() {
      try {
        const latest = await fetchSession(sessionId);
        if (cancelled) {
          return;
        }
        setSession(latest);

        if (latest.status === "processing" || latest.status === "in-progress") {
          setProgress((current) => Math.min(current + 8, 92));
          setStepIndex((current) => Math.min(current + 1, steps.length - 2));
        } else if (latest.status === "completed") {
          setProgress(100);
          setStepIndex(steps.length - 1);
        } else if (latest.status === "failed") {
          setError("Video analysis failed. Check backend logs and try again.");
        }
      } catch {
        if (!cancelled) {
          setError("Could not load processing status.");
        }
      }
    }

    poll();
    const interval = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sessionId]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Processing Session"
        description="The Ram-branch AI pipeline is analyzing the uploaded therapy video."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>AI processing pipeline</CardTitle>
          <CardDescription>
            {USE_API
              ? "Generating annotated video, frame_data.csv, and session report from your upload."
              : "This simulates the integrated FastAPI + Python engine."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{steps[stepIndex]}</span>
              <span className="tabular-nums text-muted-foreground">
                {progress}%
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 text-sm"
                style={{ opacity: index <= stepIndex ? 1 : 0.4 }}
              >
                {index < stepIndex || complete ? (
                  <CheckCircle2 className="size-4 text-[#22C55E]" />
                ) : index === stepIndex ? (
                  <LoaderCircle className="size-4 animate-spin text-[#2563EB]" />
                ) : (
                  <span className="size-4 rounded-full border border-border" />
                )}
                {step}
              </div>
            ))}
          </div>

          {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}

          {complete ? (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link href={reportHref}>View report</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={dashboardHref}>View dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sessions">Back to sessions</Link>
              </Button>
            </div>
          ) : failed ? (
            <Button variant="outline" asChild>
              <Link href={`/sessions/${sessionId}/upload`}>Try again</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
