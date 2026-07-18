"use client";

import { useEffect, useRef, useState } from "react";

import {
  CALIBRATION_HOLD_MS,
  CALIBRATION_POINTS,
  type CalibrationPointCapture,
} from "@/types/calibration";
import { cn } from "@/lib/utils";

interface GazeCalibrationFlowProps {
  recordingStartedAt: number;
  onComplete: (captures: CalibrationPointCapture[]) => void;
}

export default function GazeCalibrationFlow({
  recordingStartedAt,
  onComplete,
}: GazeCalibrationFlowProps) {
  const [pointIndex, setPointIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const capturesRef = useRef<CalibrationPointCapture[]>([]);

  const activePoint = CALIBRATION_POINTS[pointIndex];
  const isComplete = pointIndex >= CALIBRATION_POINTS.length;

  useEffect(() => {
    capturesRef.current = [];
  }, []);

  useEffect(() => {
    if (isComplete) {
      return;
    }

    const point = CALIBRATION_POINTS[pointIndex];
    const startMs = Math.max(0, Math.round(performance.now() - recordingStartedAt));
    const startedAt = performance.now();
    let frameId = 0;

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      setProgress(Math.min(100, (elapsed / CALIBRATION_HOLD_MS) * 100));
      if (elapsed < CALIBRATION_HOLD_MS) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    const timer = window.setTimeout(() => {
      const endMs = Math.round(performance.now() - recordingStartedAt);
      const capture: CalibrationPointCapture = {
        id: point.id,
        label: point.label,
        xPercent: point.xPercent,
        yPercent: point.yPercent,
        startMs,
        endMs,
      };

      const nextCaptures = [...capturesRef.current, capture];
      capturesRef.current = nextCaptures;

      if (nextCaptures.length === CALIBRATION_POINTS.length) {
        onComplete(nextCaptures);
      }

      setPointIndex((current) => current + 1);
      setProgress(0);
    }, CALIBRATION_HOLD_MS);

    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frameId);
    };
  }, [isComplete, onComplete, pointIndex, recordingStartedAt]);

  if (isComplete || !activePoint) {
    return (
      <div className="relative z-10 flex flex-1 items-center justify-center text-white">
        <p className="text-lg font-medium">Calibration complete</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      <div className="absolute inset-x-0 top-6 z-10 px-6 text-center text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">
          Gaze calibration {pointIndex + 1} / {CALIBRATION_POINTS.length}
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{activePoint.instruction}</h3>
        <p className="mt-2 text-sm text-white/70">
          Keep your head still and follow each dot with your eyes.
        </p>
      </div>

      <div className="relative flex-1">
        {CALIBRATION_POINTS.map((point, index) => (
          <div
            key={point.id}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
              index === pointIndex ? "scale-100 opacity-100" : "scale-75 opacity-0"
            )}
            style={{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }}
          >
            <div className="relative flex size-16 items-center justify-center">
              <span className="absolute inline-flex size-16 animate-ping rounded-full bg-[#60A5FA]/40" />
              <span className="relative inline-flex size-10 rounded-full border-4 border-white bg-[#2563EB] shadow-[0_0_30px_rgba(37,99,235,0.8)]" />
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-8 px-8">
        <div className="h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-[#60A5FA] transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
