"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Square, X } from "lucide-react";

import GazeCalibrationFlow from "@/components/sessions/GazeCalibrationFlow";
import SessionStimulusPlayer from "@/components/sessions/SessionStimulusPlayer";
import { Button } from "@/components/ui/button";
import { useWebcamStream } from "@/hooks/useWebcamStream";
import type { StimulusVideoItem } from "@/types/stimulus-video";
import {
  CALIBRATION_POINTS,
  createDefaultSessionCalibration,
  createSessionCalibrationFromCaptures,
  withStimulusStart,
  type CalibrationPointCapture,
  type SessionCalibration,
} from "@/types/calibration";
import { cn } from "@/lib/utils";

type RecordStep = "choice" | "calibrating" | "recording" | "complete";

interface SessionRecordModalProps {
  open: boolean;
  stimulus: StimulusVideoItem;
  onClose: () => void;
  onComplete: (file: File, calibration: SessionCalibration) => void;
}

export default function SessionRecordModal({
  open,
  stimulus,
  onClose,
  onComplete,
}: SessionRecordModalProps) {
  const [step, setStep] = useState<RecordStep>("choice");
  const [skippedCalibration, setSkippedCalibration] = useState(false);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [calibration, setCalibration] = useState<SessionCalibration>(
    createDefaultSessionCalibration()
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);

  const { videoRef, streamRef, ready, error, stopStream } = useWebcamStream({
    enabled: open,
    audio: true,
  });

  const resetState = useCallback(() => {
    setStep("choice");
    setSkippedCalibration(false);
    setRecordedFile(null);
    setCalibration(createDefaultSessionCalibration());
    chunksRef.current = [];
    recordingStartedAtRef.current = 0;
    mediaRecorderRef.current = null;
  }, []);

  const closeModal = useCallback(() => {
    mediaRecorderRef.current?.stop();
    stopStream();
    resetState();
    onClose();
  }, [onClose, resetState, stopStream]);

  const startRecorder = useCallback(() => {
    if (!streamRef.current) {
      return;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    recordingStartedAtRef.current = performance.now();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const file = new File([blob], `webcam-recording-${Date.now()}.webm`, {
        type: mimeType,
      });
      setRecordedFile(file);
      setStep("complete");
    };

    recorder.start();
  }, [streamRef]);

  const stopRecorder = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const beginStimulusRecording = useCallback(
    (captures: CalibrationPointCapture[], skipped: boolean) => {
      const stimulusStartMs = Math.max(
        0,
        Math.round(performance.now() - recordingStartedAtRef.current)
      );

      const nextCalibration = skipped
        ? withStimulusStart(createDefaultSessionCalibration(), stimulusStartMs)
        : createSessionCalibrationFromCaptures(captures, false, stimulusStartMs);

      setCalibration(nextCalibration);
      setStep("recording");
    },
    []
  );

  function handleChooseCalibrate() {
    setSkippedCalibration(false);
    startRecorder();
    setStep("calibrating");
  }

  function handleChooseSkip() {
    setSkippedCalibration(true);
    startRecorder();
    beginStimulusRecording([], true);
  }

  function handleCalibrationComplete(captures: CalibrationPointCapture[]) {
    beginStimulusRecording(captures, false);
  }

  function handleFinishRecording() {
    onComplete(recordedFile!, calibration);
    closeModal();
  }

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, resetState]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && step !== "recording" && step !== "calibrating") {
        closeModal();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeModal, open, step]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020617] text-white">
      <header className="relative z-30 flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            NeuroLens session capture
          </p>
          <h2 className="text-lg font-semibold">
            {step === "choice"
              ? "Prepare to record"
              : step === "calibrating"
                ? "Gaze calibration"
                : step === "recording"
                  ? "Stimulus session"
                  : "Recording ready"}
          </h2>
        </div>
        {step === "choice" || step === "complete" ? (
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close recorder"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col">
        {/* Webcam keeps recording; hidden during stimulus except calibration backdrop. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 overflow-hidden",
            step === "calibrating" ? "opacity-30" : "opacity-0"
          )}
          aria-hidden
        >
          <video ref={videoRef} muted playsInline className="size-full object-cover" />
        </div>

        {step === "choice" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
            <div className="max-w-xl text-center">
              <h3 className="text-3xl font-semibold">Record therapy session</h3>
              <p className="mt-3 text-base text-white/70">
                Calibrate gaze, then show simple on-screen visuals for the child
                to identify. Analysis uses only the stimulus portion of the
                recording.
              </p>
            </div>

            <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
              <button
                type="button"
                disabled={!ready}
                onClick={handleChooseCalibrate}
                className="rounded-2xl border border-[#2563EB] bg-[#2563EB]/15 p-6 text-left transition hover:bg-[#2563EB]/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <p className="text-lg font-semibold text-[#93C5FD]">
                  Calibrate &amp; record
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Run {CALIBRATION_POINTS.length}-point gaze calibration, then
                  play identification visuals while recording continues.
                </p>
              </button>
              <button
                type="button"
                disabled={!ready}
                onClick={handleChooseSkip}
                className="rounded-2xl border border-white/15 bg-white/5 p-6 text-left transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <p className="text-lg font-semibold">Skip &amp; record</p>
                <p className="mt-2 text-sm text-white/70">
                  Skip calibration and go straight to the stimulus visuals with
                  the default gaze profile.
                </p>
              </button>
            </div>

            {error ? <p className="text-sm text-[#FCA5A5]">{error}</p> : null}
            {!ready && !error ? (
              <p className="text-sm text-white/60">Starting camera...</p>
            ) : null}
          </div>
        ) : null}

        {step === "calibrating" ? (
          <GazeCalibrationFlow
            recordingStartedAt={recordingStartedAtRef.current}
            onComplete={handleCalibrationComplete}
          />
        ) : null}

        {step === "recording" ? (
          <div className="relative z-20 flex min-h-0 flex-1 flex-col">
            <SessionStimulusPlayer stimulus={stimulus} className="flex-1" />

            <div className="absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/50 to-transparent px-5 py-4">
              <p className="text-center text-sm text-white/85">
                {stimulus.title} ·{" "}
                {skippedCalibration ? "Default calibration" : "Calibration complete"}
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t from-black/60 to-transparent px-6 pb-8 pt-10">
              <Button
                type="button"
                size="lg"
                variant="destructive"
                onClick={stopRecorder}
                className="min-w-[220px] shadow-lg"
              >
                <Square className="mr-2 size-4 fill-current" />
                Stop recording
              </Button>
            </div>
          </div>
        ) : null}

        {step === "complete" ? (
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6">
            <div className="max-w-lg rounded-2xl border border-white/15 bg-black/50 px-6 py-8 text-center backdrop-blur-md">
              <h3 className="text-2xl font-semibold">Recording captured</h3>
              <p className="mt-2 text-sm text-white/70">{recordedFile?.name}</p>
              <p className="mt-4 text-sm text-white/60">
                Calibration:{" "}
                {calibration.skipped
                  ? "Default baseline"
                  : `${calibration.pointCaptures.length} points captured`}
              </p>
              <p className="mt-1 text-sm text-white/60">
                Analysis starts at{" "}
                {((calibration.analysisStartMs ?? 0) / 1000).toFixed(1)}s
                (stimulus onset)
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="button" size="lg" onClick={handleFinishRecording}>
                Use this recording
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={closeModal}>
                Discard
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
