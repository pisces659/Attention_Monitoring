"use client";

import { useEffect, useRef, useState } from "react";

import {
  SESSION_STIMULUS_SLIDES,
  STIMULUS_SLIDE_DURATION_MS,
  type StimulusSlide,
} from "@/data/session-stimulus";
import { resolveMediaUrl } from "@/lib/api-config";
import type { StimulusVideoItem } from "@/types/stimulus-video";
import { cn } from "@/lib/utils";

function speakPrompt(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function StimulusShape({ slide }: { slide: StimulusSlide }) {
  if (slide.shape === "word") {
    return (
      <div className="flex flex-col items-center gap-4">
        <span className="text-7xl" aria-hidden>
          🐘
        </span>
        <p
          className="text-5xl font-black tracking-[0.2em] sm:text-6xl"
          style={{ color: slide.accent }}
        >
          {slide.word}
        </p>
      </div>
    );
  }

  const baseClass = "drop-shadow-lg";

  if (slide.shape === "circle") {
    return (
      <div
        className={cn(baseClass, "size-40 rounded-full sm:size-52")}
        style={{ backgroundColor: slide.accent }}
      />
    );
  }

  if (slide.shape === "square") {
    return (
      <div
        className={cn(baseClass, "size-40 sm:size-48")}
        style={{ backgroundColor: slide.accent }}
      />
    );
  }

  if (slide.shape === "triangle") {
    return (
      <div
        className={cn(baseClass, "size-0")}
        style={{
          borderLeft: "90px solid transparent",
          borderRight: "90px solid transparent",
          borderBottom: `156px solid ${slide.accent}`,
        }}
      />
    );
  }

  return (
    <div
      className={cn(baseClass, "text-[140px] leading-none sm:text-[180px]")}
      style={{ color: slide.accent }}
      aria-hidden
    >
      ★
    </div>
  );
}

interface SessionStimulusPlayerProps {
  stimulus: StimulusVideoItem;
  className?: string;
  onFinished?: () => void;
}

export default function SessionStimulusPlayer({
  stimulus,
  className,
  onFinished,
}: SessionStimulusPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const videoSrc = stimulus.videoUrl ? resolveMediaUrl(stimulus.videoUrl) : "";
  const useBuiltinSlides = !videoSrc || stimulus.isBuiltin;

  useEffect(() => {
    finishedRef.current = false;
    setSlideIndex(0);
  }, [stimulus.id]);

  useEffect(() => {
    if (!useBuiltinSlides) {
      return;
    }

    const slide = SESSION_STIMULUS_SLIDES[slideIndex];
    if (!slide) {
      return;
    }

    speakPrompt(slide.prompt);

    if (slideIndex >= SESSION_STIMULUS_SLIDES.length - 1) {
      const timer = window.setTimeout(() => {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinished?.();
        }
      }, STIMULUS_SLIDE_DURATION_MS);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setSlideIndex((current) => current + 1);
    }, STIMULUS_SLIDE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [onFinished, slideIndex, useBuiltinSlides]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!useBuiltinSlides && videoSrc) {
    return (
      <div className={cn("relative flex min-h-0 flex-1 flex-col bg-black", className)}>
        <video
          ref={videoRef}
          src={videoSrc}
          className="size-full object-contain"
          autoPlay
          playsInline
          onPlay={() => {
            const area = stimulus.focusAreas[0];
            if (area?.prompt) {
              speakPrompt(area.prompt);
            }
          }}
          onEnded={() => {
            if (!finishedRef.current) {
              finishedRef.current = true;
              onFinished?.();
            }
          }}
        />
      </div>
    );
  }

  const slide = SESSION_STIMULUS_SLIDES[slideIndex] ?? SESSION_STIMULUS_SLIDES[0];

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10 text-center transition-colors duration-500",
        className
      )}
      style={{ backgroundColor: slide.background }}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
        Slide {slideIndex + 1} / {SESSION_STIMULUS_SLIDES.length}
      </p>
      <h3 className="mt-4 max-w-2xl text-3xl font-bold text-slate-900 sm:text-4xl">
        {slide.prompt}
      </h3>

      <div className="my-10 flex min-h-[220px] items-center justify-center">
        <StimulusShape slide={slide} />
      </div>

      <p className="text-lg font-medium text-slate-700">{slide.label}</p>
    </div>
  );
}
