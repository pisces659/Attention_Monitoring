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

const STALL_MINUTES = 8;

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function failureMessage(session: Session | null): string {
  if (!session?.doctorNotes) {
    return "Video analysis failed. Check the backend terminal and try again.";
  }
  const match = session.doctorNotes.match(/Analysis failed:\s*(.+)$/s);
  return match?.[1]?.trim() || session.doctorNotes;
}

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
  const [progress, setProgress] = useState(5);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt] = useState(() => Date.now());

  const reportId = session?.reportId || reportIdParam;
  const reportHref =
    USE_API && reportId ? `/reports/${reportId}` : "/reports/rep-001";
  const dashboardHref = patientId
    ? `/dashboard?patientId=${encodeURIComponent(patientId)}`
    : "/dashboard";

  const complete =
    session?.status === "completed" || (!USE_API && progress >= 100);
  const failed = session?.status === "failed";
  const processing =
    session?.status === "processing" || session?.status === "in-progress";

  useEffect(() => {
    const tick = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [startedAt]);

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
          setStepIndex((current) => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            if (elapsed < 15) return 1;
            if (elapsed < 45) return 2;
            if (elapsed < 90) return 3;
            return 4;
          });
          setProgress((current) => Math.min(current + 2, 95));
        } else if (latest.status === "completed") {
          setProgress(100);
          setStepIndex(steps.length - 1);
          setError("");
        } else if (latest.status === "failed") {
          setError(failureMessage(latest));
        }
      } catch {
        if (!cancelled) {
          setError("Could not load processing status.");
        }
      }
    }

    poll();
    const interval = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sessionId, startedAt]);

  useEffect(() => {
    if (!processing || failed || complete) {
      return;
    }
    if (elapsedSeconds >= STALL_MINUTES * 60) {
      setError(
        `Processing has run for over ${STALL_MINUTES} minutes. Stop the backend (Ctrl+C), restart with .\\run_dev.ps1, and upload again. Check the backend terminal for errors.`
      );
    }
  }, [elapsedSeconds, processing, failed, complete]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Processing Session"
        description="The AI pipeline is analyzing your therapy video. This usually takes 1–3 minutes."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>AI processing pipeline</CardTitle>
          <CardDescription>
            {USE_API
              ? "Generating annotated video, frame_data.csv, and session report."
              : "This simulates the integrated FastAPI + Python engine."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{steps[stepIndex]}</span>
              <span className="tabular-nums text-muted-foreground">
                {complete ? 100 : progress}% · {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <Progress value={complete ? 100 : progress} />
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
                ) : index === stepIndex && !failed ? (
                  <LoaderCircle className="size-4 animate-spin text-[#2563EB]" />
                ) : (
                  <span className="size-4 rounded-full border border-border" />
                )}
                {step}
              </div>
            ))}
          </div>

          {processing && !failed && !complete ? (
            <p className="text-sm text-muted-foreground">
              First run may take longer while AI models download. Keep this tab
              open and watch the backend terminal for progress logs.
            </p>
          ) : null}

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
          ) : failed || error ? (
            <Button variant="outline" asChild>
              <Link href={`/sessions/${sessionId}/upload`}>Try again</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
