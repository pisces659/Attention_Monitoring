"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CalendarClock, Upload, Video } from "lucide-react";

import PageHeader from "@/components/dashboard/PageHeader";
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
import { cn } from "@/lib/utils";

function FileUploadField({
  id,
  label,
  hint,
  accept,
  fileName,
  onFileChange,
}: {
  id: string;
  label: string;
  hint: string;
  accept: string;
  fileName: string;
  onFileChange: (file: File | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center transition hover:bg-muted/40"
      >
        <Upload className="size-7 text-[#2563EB]" />
        <p className="mt-3 font-medium text-foreground">
          {fileName || "Click to upload"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        <Input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0])}
        />
      </label>
    </div>
  );
}

function NewSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  const [patients, setPatients] = useState<PatientOption[]>(patientOptions);
  const [patientId, setPatientId] = useState(patientOptions[0]?.id ?? "");
  const [sessionKind, setSessionKind] = useState<SessionKind>("pre_recorded");
  const [sessionAt, setSessionAt] = useState(toDatetimeLocalValue());
  const [notes, setNotes] = useState("");
  const [rawVideo, setRawVideo] = useState<File | undefined>();
  const [annotatedVideo, setAnnotatedVideo] = useState<File | undefined>();
  const [csvFile, setCsvFile] = useState<File | undefined>();
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

    if (sessionKind === "pre_recorded" && !csvFile) {
      setError("Please upload the session CSV file (frame_data output).");
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
        const session = await createSession(payload);
        router.push(`/sessions?patientId=${encodeURIComponent(patientId)}`);
        router.refresh();
        return;
      }

      const session = await createAndUploadSession(payload, {
        rawVideo,
        annotatedVideo,
        csvFile: csvFile!,
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
        description="Upload a pre-recorded therapy session with a custom date, or schedule a future appointment."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Session details</CardTitle>
          <CardDescription>
            Choose whether this is a historical upload or a planned appointment.
            The date you set is what appears on the dashboard and reports.
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
                  Pre-recorded upload
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload video and CSV from a session that already happened.
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
                  Mark a future session for reference. Upload results later.
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
              <>
                <FileUploadField
                  id="raw-video"
                  label="Raw therapy video"
                  hint="MP4, MOV, or WEBM"
                  accept="video/*"
                  fileName={rawVideo?.name ?? ""}
                  onFileChange={setRawVideo}
                />

                <FileUploadField
                  id="annotated-video"
                  label="Annotated video"
                  hint="Video with face landmarks overlay"
                  accept="video/*"
                  fileName={annotatedVideo?.name ?? ""}
                  onFileChange={setAnnotatedVideo}
                />

                <FileUploadField
                  id="csv-file"
                  label="Session CSV (required)"
                  hint="frame_data.csv from the analysis pipeline"
                  accept=".csv,text/csv"
                  fileName={csvFile?.name ?? ""}
                  onFileChange={setCsvFile}
                />
              </>
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
                    : "Upload & process"}
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
