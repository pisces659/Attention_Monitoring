"""Auto-analyze uploaded stimulus videos for duration, keywords, and focus-area windows."""

from __future__ import annotations

import logging
import re
import tempfile
from pathlib import Path

import cv2
import numpy as np

from pipeline.ffmpeg_utils import extract_audio_wav, probe_duration_seconds
from pipeline.modules.audio.speech import SpeechRecognizer

logger = logging.getLogger(__name__)

_STOP_WORDS = frozenset(
    {
        "a",
        "an",
        "the",
        "is",
        "this",
        "that",
        "what",
        "how",
        "many",
        "does",
        "do",
        "are",
        "was",
        "were",
        "be",
        "to",
        "of",
        "in",
        "on",
        "at",
        "it",
        "and",
        "or",
        "for",
        "with",
        "you",
        "your",
        "say",
        "look",
        "see",
        "can",
        "will",
        "have",
        "has",
        "i",
        "we",
        "they",
        "he",
        "she",
    }
)


def _slugify(word: str, index: int) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", word.lower()).strip("-")
    return slug or f"area-{index + 1}"


def _keywords_from_transcript(segments: list[dict]) -> list[str]:
    seen: set[str] = set()
    keywords: list[str] = []
    for segment in segments:
        for token in segment.get("text", "").split():
            cleaned = token.strip(".,!?;:\"'()[]").lower()
            if not cleaned or cleaned in _STOP_WORDS or cleaned in seen:
                continue
            seen.add(cleaned)
            keywords.append(cleaned)
    return keywords


def _equal_windows(duration_ms: int, count: int) -> list[tuple[int, int]]:
    if count <= 0:
        return [(0, duration_ms)]
    step = max(duration_ms // count, 1)
    windows: list[tuple[int, int]] = []
    for index in range(count):
        start_ms = index * step
        end_ms = duration_ms if index == count - 1 else (index + 1) * step
        windows.append((start_ms, end_ms))
    return windows


def _detect_scene_boundaries_ms(video_path: Path, duration_ms: int) -> list[int]:
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        return []

    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    previous_hist: np.ndarray | None = None
    diffs: list[tuple[int, float]] = []
    frame_index = 0

    try:
        while True:
            success, frame = capture.read()
            if not success:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            hist = cv2.calcHist([gray], [0], None, [64], [0, 256])
            hist = cv2.normalize(hist, hist).flatten()

            if previous_hist is not None:
                diff = float(cv2.compareHist(previous_hist, hist, cv2.HISTCMP_BHATTACHARYYA))
                timestamp_ms = int((frame_index / fps) * 1000)
                diffs.append((timestamp_ms, diff))

            previous_hist = hist
            frame_index += 1
    finally:
        capture.release()

    if not diffs:
        return []

    threshold = float(np.percentile([value for _, value in diffs], 80))
    peaks = [timestamp for timestamp, value in diffs if value >= threshold]
    if not peaks:
        return []

    merged: list[int] = []
    for timestamp in sorted(set(peaks)):
        if not merged or timestamp - merged[-1] > 500:
            merged.append(timestamp)

    if 0 not in merged:
        merged.insert(0, 0)
    if duration_ms not in merged:
        merged.append(duration_ms)
    return merged


def _windows_from_boundaries(boundaries_ms: list[int], count: int) -> list[tuple[int, int]]:
    if len(boundaries_ms) < 2:
        return _equal_windows(boundaries_ms[-1] if boundaries_ms else 0, count)

    interior = boundaries_ms[1:-1]
    if len(interior) >= count - 1:
        selected = interior[: count - 1]
        points = [boundaries_ms[0], *selected, boundaries_ms[-1]]
    else:
        duration_ms = boundaries_ms[-1]
        points = [0]
        points.extend(interior)
        while len(points) < count:
            points.append(int(duration_ms * len(points) / count))
        points.append(duration_ms)

    windows: list[tuple[int, int]] = []
    for index in range(min(count, len(points) - 1)):
        windows.append((points[index], points[index + 1]))
    return windows


def _segment_windows(video_path: Path, duration_ms: int, count: int) -> list[tuple[int, int]]:
    if count <= 0:
        return [(0, duration_ms)]

    boundaries = _detect_scene_boundaries_ms(video_path, duration_ms)
    if len(boundaries) >= 3:
        windows = _windows_from_boundaries(boundaries, count)
        if len(windows) == count:
            return windows

    return _equal_windows(duration_ms, count)


def analyze_stimulus_video(
    video_bytes: bytes,
    filename: str,
    keywords: list[str] | None = None,
) -> dict:
    """Probe duration, transcribe audio, and build focus-area timing windows."""
    suffix = Path(filename).suffix or ".mp4"

    with tempfile.TemporaryDirectory() as tmp_dir:
        video_path = Path(tmp_dir) / f"stimulus{suffix}"
        video_path.write_bytes(video_bytes)

        duration_s = probe_duration_seconds(video_path) or 0.0
        duration_ms = max(int(duration_s * 1000), 1)

        audio_path = Path(tmp_dir) / "audio.wav"
        try:
            extract_audio_wav(video_path, audio_path)
            speech = SpeechRecognizer()
            _text, segments = speech.recognize(str(audio_path))
        except Exception as exc:
            logger.warning("Stimulus audio analysis failed: %s", exc)
            segments = []

        resolved_keywords = [word.strip().lower() for word in (keywords or []) if word.strip()]
        if not resolved_keywords:
            resolved_keywords = _keywords_from_transcript(segments)

        if not resolved_keywords:
            resolved_keywords = ["response"]

        windows = _segment_windows(video_path, duration_ms, len(resolved_keywords))

        focus_areas: list[dict] = []
        for index, word in enumerate(resolved_keywords):
            start_ms, end_ms = windows[index] if index < len(windows) else (0, duration_ms)
            focus_areas.append(
                {
                    "id": _slugify(word, index),
                    "label": word.capitalize(),
                    "startMs": start_ms,
                    "endMs": end_ms,
                    "keywords": [word],
                    "prompt": f"Say {word}",
                }
            )

        return {
            "durationMs": duration_ms,
            "focusAreas": focus_areas,
            "keywords": resolved_keywords,
        }
