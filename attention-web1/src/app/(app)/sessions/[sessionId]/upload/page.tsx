"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";

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
import { API_ENDPOINTS, USE_API } from "@/lib/api-config";
import { apiFetch } from "@/lib/api-client";
import type { Session } from "@/types";
import { uploadSessionFiles } from "@/services/session-upload-service";

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

export default function UploadSessionPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [session, setSession] = useState<Session | null>(null);
  const [rawVideo, setRawVideo] = useState<File | undefined>();
  const [annotatedVideo, setAnnotatedVideo] = useState<File | undefined>();
  const [csvFile, setCsvFile] = useState<File | undefined>();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId || !USE_API) {
      return;
    }

    apiFetch<Session>(API_ENDPOINTS.session(sessionId))
      .then(setSession)
      .catch(() => setError("Could not load session details."));
  }, [sessionId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!csvFile) {
      setError("Please upload the session CSV file.");
      return;
    }

    setSubmitting(true);

    try {
      const updated = await uploadSessionFiles(sessionId, {
        rawVideo,
        annotatedVideo,
        csvFile,
      });

      const query = new URLSearchParams();
      if (updated.reportId) {
        query.set("reportId", updated.reportId);
      }
      if (updated.patientId) {
        query.set("patientId", updated.patientId);
      }

      router.push(`/sessions/${sessionId}/processing?${query.toString()}`);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Upload session results"
        description="Add video and CSV results to a scheduled or pending session."
      />

      {session ? (
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader>
            <CardTitle>{session.patientName}</CardTitle>
            <CardDescription>
              Session time: {session.dateLabel}
              {session.doctorNotes ? ` • ${session.doctorNotes}` : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Upload files</CardTitle>
          <CardDescription>
            The session date stays as originally scheduled. Only the analysis
            files are added now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
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

            {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting || !sessionId}>
                {submitting ? "Uploading..." : "Upload & process"}
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
