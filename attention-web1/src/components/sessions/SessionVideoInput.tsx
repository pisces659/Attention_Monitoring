"use client";

import { useState } from "react";
import { Upload, Video } from "lucide-react";

import WebcamRecorder from "@/components/sessions/WebcamRecorder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export type VideoInputMode = "upload" | "webcam";

interface SessionVideoInputProps {
  mode: VideoInputMode;
  onModeChange: (mode: VideoInputMode) => void;
  videoFile?: File;
  onVideoFileChange: (file: File | undefined) => void;
  expectedWord: string;
  onExpectedWordChange: (value: string) => void;
  disabled?: boolean;
}

export default function SessionVideoInput({
  mode,
  onModeChange,
  videoFile,
  onVideoFileChange,
  expectedWord,
  onExpectedWordChange,
  disabled = false,
}: SessionVideoInputProps) {
  const [webcamFile, setWebcamFile] = useState<File | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            onModeChange("upload");
            onVideoFileChange(undefined);
            setWebcamFile(null);
          }}
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            mode === "upload"
              ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]/30"
              : "border-border hover:bg-muted/30"
          )}
        >
          <div className="flex items-center gap-2 font-medium">
            <Upload className="size-4 text-[#2563EB]" />
            Upload recorded video
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose an MP4, MOV, or WEBM file from a past session.
          </p>
        </button>
        <button
          type="button"
          onClick={() => {
            onModeChange("webcam");
            onVideoFileChange(undefined);
            setWebcamFile(null);
          }}
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            mode === "webcam"
              ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]/30"
              : "border-border hover:bg-muted/30"
          )}
        >
          <div className="flex items-center gap-2 font-medium">
            <Video className="size-4 text-[#2563EB]" />
            Record with webcam
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Capture a live therapy session directly in the browser.
          </p>
        </button>
      </div>

      {mode === "upload" ? (
        <FileUploadField
          id="session-video"
          label="Therapy video"
          hint="The AI pipeline will generate annotated video and CSV metrics."
          accept="video/*"
          fileName={videoFile?.name ?? ""}
          onFileChange={onVideoFileChange}
        />
      ) : (
        <WebcamRecorder
          disabled={disabled}
          onRecordingComplete={(file) => {
            setWebcamFile(file);
            onVideoFileChange(file);
          }}
        />
      )}

      {mode === "webcam" && webcamFile ? (
        <p className="text-sm text-muted-foreground">
          Selected recording: {webcamFile.name}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="expected-word">Expected speech keyword (optional)</Label>
        <Input
          id="expected-word"
          value={expectedWord}
          onChange={(event) => onExpectedWordChange(event.target.value)}
          placeholder="e.g. Elephant"
        />
        <p className="text-xs text-muted-foreground">
          Used by the speech recognition step in the Ram analysis pipeline.
        </p>
      </div>
    </div>
  );
}
