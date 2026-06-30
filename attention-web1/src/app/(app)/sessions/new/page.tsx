"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { patientOptions } from "@/mock/patient-options";

export default function NewSessionPage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState(patientOptions[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/sessions/sess-1001/processing");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Create Session"
        description="Select a patient, upload a therapy session video, and start mock AI processing."
      />

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Session details</CardTitle>
          <CardDescription>
            Video upload is mocked locally. Processing uses sample CSV output.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="patient">Patient</Label>
              <Select
                id="patient"
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
              >
                {patientOptions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Therapy session video</Label>
              <label
                htmlFor="video"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center transition hover:bg-muted/40"
              >
                <Upload className="size-8 text-[#2563EB]" />
                <p className="mt-3 font-medium text-foreground">
                  {fileName || "Click to upload video"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  MP4, MOV, or WEBM up to 500MB
                </p>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(event) =>
                    setFileName(event.target.files?.[0]?.name ?? "")
                  }
                />
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Doctor notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional pre-session observations..."
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">Start processing</Button>
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
