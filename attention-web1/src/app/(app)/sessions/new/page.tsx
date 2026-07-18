"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CalendarClock, Video } from "lucide-react";

import PageHeader from "@/components/dashboard/PageHeader";
import SessionVideoInput, {
  type SessionVideoSelection,
  type VideoInputMode,
} from "@/components/sessions/SessionVideoInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { USE_API } from "@/lib/api-config";
import type { SessionKind } from "@/types";
import { patientOptions } from "@/mock/patient-options";
import {
  createAndUploadSession,
  createSession,
  datetimeLocalToIso,
  fetchPatientOptions,
  toDatetimeLocalValue,
  type PatientOption,
} from "@/services/session-upload-service";
import { BUILTIN_STIMULUS_ID } from "@/types/stimulus-video";
import { cn } from "@/lib/utils";

function NewSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  const [patients, setPatients] = useState<PatientOption[]>(patientOptions);
  const [patientId, setPatientId] = useState(patientOptions[0]?.id ?? "");
  const [sessionKind, setSessionKind] = useState<SessionKind>("pre_recorded");
  const [sessionAt, setSessionAt] = useState(toDatetimeLocalValue());
  const [notes, setNotes] = useState("");
  const [videoMode, setVideoMode] = useState<VideoInputMode>("upload");
  const [videoSelection, setVideoSelection] = useState<SessionVideoSelection>();
  const [stimulusVideoId, setStimulusVideoId] = useState(BUILTIN_STIMULUS_ID);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!USE_API) {
      return;
    }

    fetchPatientOptions()
      .then((options) => {
        setPatients(options);
        const preferredId =
          preselectedPatientId &&
          options.some((option) => option.id === preselectedPatientId)
            ? preselectedPatientId
            : options[0]?.id;
        if (preferredId) {
          setPatientId(preferredId);
        }
      })
      .catch(() => setError("Could not load patients from the API."));
  }, [preselectedPatientId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!USE_API) {
      router.push("/sessions/sess-1001/processing");
      return;
    }

    if (!sessionAt) {
      setError("Please choose a session date and time.");
      return;
    }

    if (sessionKind === "pre_recorded" && !videoSelection?.file) {
      setError("Please upload or record a therapy video.");
      return;
    }

    setSubmitting(true);

    const payload = {
      patientId,
      doctorNotes: notes,
      sessionKind,
      sessionAt: datetimeLocalToIso(sessionAt),
    };

    try {
      if (sessionKind === "scheduled") {
        await createSession(payload);
        router.push(`/sessions?patientId=${encodeURIComponent(patientId)}`);
        router.refresh();
        return;
      }

      const session = await createAndUploadSession(payload, {
        video: videoSelection!.file!,
        calibration: videoSelection!.calibration,
        stimulusVideoId: videoSelection!.stimulusVideoId ?? stimulusVideoId,
      });

      const params = new URLSearchParams();
      if (session.reportId) {
        params.set("reportId", session.reportId);
      }
      params.set("patientId", patientId);
      router.push(`/sessions/${session.id}/processing?${params.toString()}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save session. Is the backend running on port 8000?"
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Create Session"
        description="Upload or record a therapy video. The AI pipeline generates annotated video and CSV metrics automatically."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Session details</CardTitle>
          <CardDescription>
            Choose whether this is a video session to analyze now or a future
            appointment to upload later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSessionKind("pre_recorded")}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  sessionKind === "pre_recorded"
                    ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]/30"
                    : "border-border hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  <Video className="size-4 text-[#2563EB]" />
                  Video session
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload or record video for AI analysis.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSessionKind("scheduled")}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  sessionKind === "scheduled"
                    ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]/30"
                    : "border-border hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  <CalendarClock className="size-4 text-[#2563EB]" />
                  Schedule appointment
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mark a future session and upload video later.
                </p>
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient">Patient</Label>
              <Select
                id="patient"
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-at">
                {sessionKind === "scheduled"
                  ? "Appointment date & time"
                  : "Session date & time (when therapy happened)"}
              </Label>
              <Input
                id="session-at"
                type="datetime-local"
                required
                value={sessionAt}
                onChange={(event) => setSessionAt(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This timestamp is stored on the session and used in charts,
                reports, and session history — not the upload time.
              </p>
            </div>

            {sessionKind === "pre_recorded" ? (
              <SessionVideoInput
                mode={videoMode}
                onModeChange={setVideoMode}
                selection={videoSelection}
                onSelectionChange={setVideoSelection}
                stimulusVideoId={stimulusVideoId}
                onStimulusVideoIdChange={setStimulusVideoId}
                disabled={submitting}
              />
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="notes">Doctor notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={
                  sessionKind === "scheduled"
                    ? "Appointment goals, parent instructions, reminders..."
                    : "Optional observations about this recorded session..."
                }
              />
            </div>

            {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : sessionKind === "scheduled"
                    ? "Schedule session"
                    : "Upload & analyze"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sessions">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-muted-foreground">
          Loading session form...
        </div>
      }
    >
      <NewSessionForm />
    </Suspense>
  );
}
