"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseWebcamStreamOptions {
  enabled?: boolean;
  audio?: boolean;
}

export function useWebcamStream({
  enabled = true,
  audio = true,
}: UseWebcamStreamOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setReady(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopStream();
      return;
    }

    let cancelled = false;

    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio,
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
        setReady(true);
        setError("");
      } catch {
        setError("Could not access webcam. Check browser permissions.");
        setReady(false);
      }
    }

    startPreview();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [audio, enabled, stopStream]);

  return {
    videoRef,
    streamRef,
    ready,
    error,
    stopStream,
  };
}
