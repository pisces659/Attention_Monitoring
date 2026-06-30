"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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

const steps = [
  "Uploading video",
  "Detecting face landmarks",
  "Tracking gaze and blinks",
  "Generating CSV metrics",
  "Building session report",
];

export default function ProcessingPage() {
  const [progress, setProgress] = useState(8);
  const [stepIndex, setStepIndex] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 12, 100);
        setStepIndex(Math.min(steps.length - 1, Math.floor(next / 20)));
        if (next >= 100) {
          window.clearInterval(interval);
          setComplete(true);
        }
        return next;
      });
    }, 700);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Processing Session"
        description="Mock AI engine is analyzing the uploaded therapy video."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>AI processing pipeline</CardTitle>
          <CardDescription>
            This simulates the future FastAPI + Python engine integration.
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
              <motion.div
                key={step}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: index <= stepIndex ? 1 : 0.4 }}
                className="flex items-center gap-3 text-sm"
              >
                {index < stepIndex || complete ? (
                  <CheckCircle2 className="size-4 text-[#22C55E]" />
                ) : index === stepIndex ? (
                  <LoaderCircle className="size-4 animate-spin text-[#2563EB]" />
                ) : (
                  <span className="size-4 rounded-full border border-border" />
                )}
                {step}
              </motion.div>
            ))}
          </div>

          {complete ? (
            <div className="flex gap-3 pt-2">
              <Button asChild>
                <Link href="/reports/rep-001">View report</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sessions">Back to sessions</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
