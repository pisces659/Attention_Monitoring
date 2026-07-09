"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Circle, Square } from "lucide-react";

import { Button } from "@/components/ui/button";

interface WebcamRecorderProps {
  onRecordingComplete: (file: File) => void;
  disabled?: boolean;
}

export default function WebcamRecorder({
  onRecordingComplete,
  disabled = false,
}: WebcamRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [previewReady, setPreviewReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setPreviewReady(true);
        setError("");
      } catch {
        setError("Could not access webcam. Check browser permissions.");
      }
    }

    startPreview();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  function startRecording() {
    if (!streamRef.current) {
      return;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

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
      onRecordingComplete(file);
    };

    recorder.start();
    setRecording(true);
    setRecordedFile(null);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Camera className="size-4 text-[#2563EB]" />
        Live webcam recording
      </div>

      <div className="overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="aspect-video w-full object-cover"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {!recording ? (
          <Button
            type="button"
            onClick={startRecording}
            disabled={disabled || !previewReady}
          >
            <Circle className="mr-2 size-4 fill-current" />
            Start recording
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={stopRecording}>
            <Square className="mr-2 size-4 fill-current" />
            Stop recording
          </Button>
        )}
      </div>

      {recordedFile ? (
        <p className="text-sm text-muted-foreground">
          Recording ready: {recordedFile.name}
        </p>
      ) : null}

      {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
    </div>
  );
}
