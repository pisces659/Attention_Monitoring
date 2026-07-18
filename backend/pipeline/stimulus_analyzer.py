"""Analyze uploaded stimulus videos to derive keyword timing windows."""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from pipeline.ffmpeg_utils import probe_duration_seconds

logger = logging.getLogger(__name__)

DEFAULT_KEYWORDS = ["red", "square", "elephant", "green", "star"]
SCENE_DIFF_THRESHOLD = 0.28
MIN_SEGMENT_SECONDS = 0.8


def _slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower().strip())
    return cleaned.strip("-") or "segment"


def detect_scene_boundaries(video_path: Path) -> list[float]:
    """Return monotonic segment boundary times in seconds (includes 0 and duration)."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return [0.0]

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration = probe_duration_seconds(video_path)
    if duration is None and fps > 0 and frame_count > 0:
        duration = frame_count / fps
    if duration is None:
        duration = 0.0

    boundaries = [0.0]
    prev_hist: np.ndarray | None = None
    frame_idx = 0
    sample_stride = max(1, int(round(fps / 3)))  # ~3 samples/sec

    while True:
        success, frame = cap.read()
        if not success:
            break

        if frame_idx % sample_stride == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            hist = cv2.calcHist([gray], [0], None, [64], [0, 256])
            cv2.normalize(hist, hist)

            if prev_hist is not None:
                diff = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA)
                timestamp = frame_idx / fps if fps else 0.0
                if (
                    diff >= SCENE_DIFF_THRESHOLD
                    and timestamp - boundaries[-1] >= MIN_SEGMENT_SECONDS
                ):
                    boundaries.append(round(timestamp, 3))

            prev_hist = hist

        frame_idx += 1

    cap.release()

    if duration <= 0 and frame_idx > 0 and fps > 0:
        duration = frame_idx / fps

    if duration > 0 and (not boundaries or boundaries[-1] < duration - 0.05):
        boundaries.append(round(duration, 3))

    return boundaries


def _equal_segment_boundaries(duration_seconds: float, segment_count: int) -> list[float]:
    if segment_count <= 0 or duration_seconds <= 0:
        return [0.0, max(duration_seconds, 0.0)]

    step = duration_seconds / segment_count
    boundaries = [round(index * step, 3) for index in range(segment_count + 1)]
    boundaries[-1] = round(duration_seconds, 3)
    return boundaries


def _pick_segment_boundaries(
    scene_boundaries: list[float],
    duration_seconds: float,
    segment_count: int,
) -> list[float]:
    if segment_count <= 0:
        return [0.0, duration_seconds]

    if len(scene_boundaries) >= segment_count + 1:
        # Use scene cuts when we have enough boundaries; pick evenly spaced cuts.
        interior = scene_boundaries[1:-1]
        if len(interior) >= segment_count - 1:
            indices = np.linspace(0, len(interior) - 1, segment_count - 1, dtype=int)
            selected = [0.0]
            selected.extend(round(interior[index], 3) for index in indices)
            selected.append(round(duration_seconds, 3))
            return selected

    return _equal_segment_boundaries(duration_seconds, segment_count)


def build_focus_areas(
    keywords: list[str],
    boundaries: list[float],
    *,
    prompts: list[str] | None = None,
) -> list[dict[str, Any]]:
    focus_areas: list[dict[str, Any]] = []
    segment_count = min(len(keywords), max(len(boundaries) - 1, 0))

    for index in range(segment_count):
        keyword = keywords[index]
        start_s = boundaries[index]
        end_s = boundaries[index + 1]
        prompt = (
            prompts[index]
            if prompts and index < len(prompts)
            else f"Say '{keyword}' when you see this."
        )
        focus_areas.append(
            {
                "id": f"{_slugify(keyword)}-{index + 1}",
                "label": keyword.title(),
                "startMs": int(round(start_s * 1000)),
                "endMs": int(round(end_s * 1000)),
                "keywords": [keyword],
                "prompt": prompt,
            }
        )

    return focus_areas


def analyze_stimulus_video(
    video_path: Path,
    *,
    keywords: list[str] | None = None,
) -> dict[str, Any]:
    """Derive focus-area timing windows from a stimulus video file."""
    video_path = Path(video_path)
    duration_seconds = probe_duration_seconds(video_path) or 0.0
    duration_ms = int(round(duration_seconds * 1000))

    keyword_list = [word.strip() for word in (keywords or []) if word and word.strip()]
    if not keyword_list:
        keyword_list = list(DEFAULT_KEYWORDS)

    scene_boundaries = detect_scene_boundaries(video_path)
    boundaries = _pick_segment_boundaries(scene_boundaries, duration_seconds, len(keyword_list))
    focus_areas = build_focus_areas(keyword_list, boundaries)

    logger.info(
        "Stimulus analysis for %s: %ss, %s segments, %s scene cuts",
        video_path.name,
        f"{duration_seconds:.1f}",
        len(focus_areas),
        max(len(scene_boundaries) - 2, 0),
    )

    return {
        "durationMs": duration_ms,
        "keywords": keyword_list,
        "focusAreas": focus_areas,
        "analysisStatus": "completed",
        "sceneBoundaries": scene_boundaries,
    }


def keywords_from_focus_areas(focus_areas: list[dict[str, Any]]) -> list[str]:
    words: list[str] = []
    seen: set[str] = set()
    for area in focus_areas:
        for keyword in area.get("keywords") or []:
            normalized = str(keyword).strip().lower()
            if normalized and normalized not in seen:
                seen.add(normalized)
                words.append(str(keyword).strip())
    return words
