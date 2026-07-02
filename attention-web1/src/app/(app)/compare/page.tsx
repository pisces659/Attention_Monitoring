"use client";

import { useEffect, useState } from "react";

import TrendChart from "@/components/charts/TrendChart";
import StatGrid from "@/components/common/StatGrid";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { completedSessionOptions } from "@/mock/session-options";
import { formatPercent } from "@/lib/format";
import { compareSessions } from "@/services/compare-service";
import { fetchCompletedSessionOptions } from "@/services/client-data-service";
import type { SessionComparison } from "@/types";

export default function ComparePage() {
  const [sessionOptions, setSessionOptions] = useState(completedSessionOptions);
  const [sessionAId, setSessionAId] = useState(
    completedSessionOptions[0]?.id ?? ""
  );
  const [sessionBId, setSessionBId] = useState(
    completedSessionOptions[1]?.id ?? ""
  );

  const [comparison, setComparison] = useState<SessionComparison | null>(null);

  useEffect(() => {
    let active = true;
    fetchCompletedSessionOptions()
      .then((options) => {
        if (!active || options.length === 0) {
          return;
        }
        setSessionOptions(options);
        setSessionAId(options[0]?.id ?? "");
        setSessionBId(options[1]?.id ?? options[0]?.id ?? "");
      })
      .catch(() => {
        // Keep mock options on failure.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionAId || !sessionBId) {
      return;
    }

    let active = true;
    compareSessions(sessionAId, sessionBId).then((result) => {
      if (active) {
        setComparison(result);
      }
    });
    return () => {
      active = false;
    };
  }, [sessionAId, sessionBId]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Compare Sessions"
        description="Compare attention, speech, blink, and focus outcomes between two therapy sessions."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Select sessions</CardTitle>
          <CardDescription>
            Choose two completed sessions to compare side by side.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="session-a">Session A</Label>
            <Select
              id="session-a"
              value={sessionAId}
              onChange={(event) => setSessionAId(event.target.value)}
            >
              {sessionOptions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-b">Session B</Label>
            <Select
              id="session-b"
              value={sessionBId}
              onChange={(event) => setSessionBId(event.target.value)}
            >
              {sessionOptions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {comparison ? (
        <>
          <StatGrid
            items={[
              {
                label: "Attention delta",
                value: `${comparison.attentionDelta > 0 ? "+" : ""}${comparison.attentionDelta}%`,
              },
              {
                label: "Speech delta",
                value: `${comparison.speechDelta > 0 ? "+" : ""}${comparison.speechDelta}%`,
              },
              {
                label: "Blink delta",
                value: comparison.blinkDelta,
              },
              {
                label: "Focus duration delta",
                value: `${comparison.focusDurationDelta}s`,
              },
              {
                label: "Eye contact delta",
                value: `${comparison.eyeContactDelta}%`,
              },
              {
                label: "Head pose delta",
                value: `${comparison.headPoseDelta}°`,
              },
              {
                label: "Improvement",
                value: formatPercent(comparison.improvementPercent),
              },
              {
                label: "Regression",
                value: formatPercent(comparison.regressionPercent),
              },
            ]}
          />

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="border-0 shadow-sm ring-1 ring-border/60">
              <CardHeader>
                <CardTitle>{comparison.sessionA.patientName}</CardTitle>
                <CardDescription>{comparison.sessionA.dateLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Attention: {formatPercent(comparison.sessionA.attentionScore)}</p>
                <p>Speech: {formatPercent(comparison.sessionA.speechScore)}</p>
                <p>Blinks: {comparison.sessionA.blinkCount}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm ring-1 ring-border/60">
              <CardHeader>
                <CardTitle>{comparison.sessionB.patientName}</CardTitle>
                <CardDescription>{comparison.sessionB.dateLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Attention: {formatPercent(comparison.sessionB.attentionScore)}</p>
                <p>Speech: {formatPercent(comparison.sessionB.speechScore)}</p>
                <p>Blinks: {comparison.sessionB.blinkCount}</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <TrendChart
              title="Session A attention trend"
              description="Attention timeline for the first selected session."
              data={comparison.attentionTrendA}
              color="#2563EB"
              chartId="compare-a"
            />
            <TrendChart
              title="Session B attention trend"
              description="Attention timeline for the second selected session."
              data={comparison.attentionTrendB}
              color="#7C3AED"
              chartId="compare-b"
            />
          </section>
        </>
      ) : (
        <Button disabled>Select two valid sessions</Button>
      )}
    </div>
  );
}
