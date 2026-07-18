"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Camera, CircleCheck, Upload, Video } from "lucide-react";

import SessionRecordModal from "@/components/sessions/SessionRecordModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DEFAULT_STIMULUS_KEYWORDS } from "@/data/session-stimulus";
import {
  fetchStimulusVideos,
  keywordsLabel,
} from "@/services/stimulus-video-service";
import {
  createDefaultSessionCalibration,
  type SessionCalibration,
} from "@/types/calibration";
import { BUILTIN_STIMULUS_ID, type StimulusVideoItem } from "@/types/stimulus-video";
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

export interface SessionVideoSelection {
  file?: File;
  calibration: SessionCalibration;
  stimulusVideoId?: string;
}

interface SessionVideoInputProps {
  mode: VideoInputMode;
  onModeChange: (mode: VideoInputMode) => void;
  selection?: SessionVideoSelection;
  onSelectionChange: (selection: SessionVideoSelection | undefined) => void;
  stimulusVideoId: string;
  onStimulusVideoIdChange: (id: string) => void;
  disabled?: boolean;
}

export default function SessionVideoInput({
  mode,
  onModeChange,
  selection,
  onSelectionChange,
  stimulusVideoId,
  onStimulusVideoIdChange,
  disabled = false,
}: SessionVideoInputProps) {
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [stimulusVideos, setStimulusVideos] = useState<StimulusVideoItem[]>([]);

  useEffect(() => {
    fetchStimulusVideos()
      .then(setStimulusVideos)
      .catch(() => setStimulusVideos([]));
  }, []);

  const selectedStimulus = useMemo(
    () =>
      stimulusVideos.find((video) => video.id === stimulusVideoId) ??
      stimulusVideos[0],
    [stimulusVideoId, stimulusVideos]
  );

  useEffect(() => {
    if (!stimulusVideos.length) {
      return;
    }
    if (!stimulusVideos.some((video) => video.id === stimulusVideoId)) {
      const defaultVideo =
        stimulusVideos.find((video) => video.isDefault) ?? stimulusVideos[0];
      onStimulusVideoIdChange(defaultVideo.id);
    }
  }, [onStimulusVideoIdChange, stimulusVideoId, stimulusVideos]);

  function clearSelection() {
    onSelectionChange(undefined);
  }

  function handleStimulusChange(id: string) {
    onStimulusVideoIdChange(id);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="stimulus-video">Stimulus video</Label>
          <Link
            href="/stimulus-videos"
            className="text-xs font-medium text-[#2563EB] hover:underline"
          >
            Manage library
          </Link>
        </div>
        <Select
          id="stimulus-video"
          value={stimulusVideoId || BUILTIN_STIMULUS_ID}
          onChange={(event) => handleStimulusChange(event.target.value)}
          disabled={disabled || !stimulusVideos.length}
        >
          {stimulusVideos.map((video) => (
            <option key={video.id} value={video.id}>
              {video.title}
              {video.isBuiltin ? " (Built-in)" : ""}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Keywords for speech analysis:{" "}
          {selectedStimulus ? keywordsLabel(selectedStimulus) : DEFAULT_STIMULUS_KEYWORDS.join(", ")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            onModeChange("upload");
            onSelectionChange(
              selection?.file
                ? {
                    file: selection.file,
                    calibration: createDefaultSessionCalibration(),
                    stimulusVideoId,
                  }
                : undefined
            );
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
            clearSelection();
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
            Calibrate gaze, play the stimulus video, and record reactions.
          </p>
        </button>
      </div>

      {mode === "upload" ? (
        <FileUploadField
          id="session-video"
          label="Therapy video"
          hint="Uses default gaze calibration. Annotated output covers the stimulus segment only."
          accept="video/*"
          fileName={selection?.file?.name ?? ""}
          onFileChange={(file) =>
            onSelectionChange(
              file
                ? {
                    file,
                    calibration: createDefaultSessionCalibration(),
                    stimulusVideoId,
                  }
                : undefined
            )
          }
        />
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Camera className="size-4 text-[#2563EB]" />
            Live session recorder
          </div>

          {selection?.file ? (
            <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-4">
              <div className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 size-5 text-[#15803D]" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#14532D]">Recording ready</p>
                  <p className="mt-1 truncate text-sm text-[#166534]">
                    {selection.file.name}
                  </p>
                  <p className="mt-1 text-xs text-[#166534]/80">
                    Stimulus: {selectedStimulus?.title ?? "Built-in"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => setRecordModalOpen(true)}
                >
                  Record again
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={clearSelection}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Opens calibration, then plays{" "}
                <span className="font-medium">{selectedStimulus?.title}</span>{" "}
                with voice prompts while recording.
              </p>
              <Button
                type="button"
                className="mt-4"
                disabled={disabled || !selectedStimulus}
                onClick={() => setRecordModalOpen(true)}
              >
                <Camera className="mr-2 size-4" />
                Record session
              </Button>
            </div>
          )}
        </div>
      )}

      {selectedStimulus ? (
        <SessionRecordModal
          open={recordModalOpen}
          stimulus={selectedStimulus}
          onClose={() => setRecordModalOpen(false)}
          onComplete={(file, calibration) => {
            onSelectionChange({ file, calibration, stimulusVideoId });
            setRecordModalOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
