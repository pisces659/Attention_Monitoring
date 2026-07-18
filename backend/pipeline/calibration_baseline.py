"""Derive per-session gaze baselines from calibration video frames."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from statistics import mean
from typing import Any

from pipeline.calibration import DEFAULT_CALIBRATION, save_calibration
from pipeline.modules.vision.blink_detector import BlinkDetector
from pipeline.modules.vision.face_detector import FaceDetector
from pipeline.modules.vision.gaze_estimator import GazeEstimator
from pipeline.modules.vision.head_pose import HeadPoseEstimator
from pipeline.modules.video_loader import VideoLoader

logger = logging.getLogger(__name__)

MIN_SAMPLES_PER_POINT = 5
WINDOW_INNER_START = 0.35
WINDOW_INNER_END = 0.85


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _avg(samples: list[dict[str, float]], key: str) -> float | None:
    values = [sample[key] for sample in samples if key in sample]
    if not values:
        return None
    return mean(values)


def _sample_window_ms(start_ms: int, end_ms: int) -> tuple[int, int]:
    duration = max(end_ms - start_ms, 1)
    inner_start = start_ms + int(duration * WINDOW_INNER_START)
    inner_end = start_ms + int(duration * WINDOW_INNER_END)
    return inner_start, max(inner_start + 1, inner_end)


def _collect_point_samples(
    video_path: str | Path,
    point_captures: list[dict[str, Any]],
) -> dict[str, list[dict[str, float]]]:
    windows: list[tuple[str, int, int]] = []
    for capture in point_captures:
        point_id = capture.get("id")
        start_ms = capture.get("startMs")
        end_ms = capture.get("endMs")
        if not point_id or start_ms is None or end_ms is None:
            continue
        inner_start, inner_end = _sample_window_ms(int(start_ms), int(end_ms))
        windows.append((str(point_id), inner_start, inner_end))

    if not windows:
        return {}

    samples: dict[str, list[dict[str, float]]] = {point_id: [] for point_id, _, _ in windows}
    max_ms = max(end for _, _, end in windows)

    detector = FaceDetector()
    blink_detector = BlinkDetector()
    head_pose = HeadPoseEstimator()
    video = VideoLoader(str(video_path))
    frame_time_ms = 1000.0 / video.fps if video.fps else 1000.0 / 30.0

    try:
        frame_no = 0
        while True:
            success, frame = video.read()
            if not success:
                break

            frame_no += 1
            timestamp_ms = int(round(frame_no * frame_time_ms))
            if timestamp_ms > max_ms:
                break

            active_points = [
                point_id
                for point_id, start, end in windows
                if start <= timestamp_ms <= end
            ]
            if not active_points:
                continue

            results = detector.process(frame, timestamp_ms)
            if not results.multi_face_landmarks:
                continue

            face = results.multi_face_landmarks[0]
            ear, _, _ = blink_detector.process(face, frame.shape)
            if ear < 0.20:
                continue

            pose = head_pose.estimate(face, frame)
            if pose is None:
                continue

            yaw, pitch, _roll = pose
            h_ratio, v_ratio = GazeEstimator.raw_eye_ratios(face, frame.shape)
            sample = {
                "hRatio": float(h_ratio),
                "vRatio": float(v_ratio),
                "yaw": float(yaw),
                "pitch": float(pitch),
            }

            for point_id in active_points:
                samples[point_id].append(sample)
    finally:
        video.release()
        detector.close()

    return samples


def build_baseline_from_samples(
    point_samples: dict[str, list[dict[str, float]]],
    *,
    fallback: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Map calibration-point gaze samples to personalized estimator thresholds."""
    defaults = (fallback or DEFAULT_CALIBRATION).get("baseline", {})
    center_samples = point_samples.get("center", [])
    if len(center_samples) < MIN_SAMPLES_PER_POINT:
        return dict(defaults)

    h_center = _avg(center_samples, "hRatio") or 0.5
    v_center = _avg(center_samples, "vRatio") or 0.5
    yaw_center = _avg(center_samples, "yaw") or 0.0
    pitch_center = _avg(center_samples, "pitch") or 0.0

    left_samples = [
        *point_samples.get("topLeft", []),
        *point_samples.get("bottomLeft", []),
    ]
    right_samples = [
        *point_samples.get("topRight", []),
        *point_samples.get("bottomRight", []),
    ]
    top_samples = [
        *point_samples.get("topLeft", []),
        *point_samples.get("topRight", []),
    ]
    bottom_samples = [
        *point_samples.get("bottomLeft", []),
        *point_samples.get("bottomRight", []),
    ]

    h_left = _avg(left_samples, "hRatio")
    h_right = _avg(right_samples, "hRatio")
    v_top = _avg(top_samples, "vRatio")
    v_bottom = _avg(bottom_samples, "vRatio")
    yaw_left = _avg(left_samples, "yaw")
    yaw_right = _avg(right_samples, "yaw")
    pitch_top = _avg(top_samples, "pitch")
    pitch_bottom = _avg(bottom_samples, "pitch")

    def iris_threshold(center_value: float, extreme_value: float | None, default: float) -> float:
        if extreme_value is None:
            return float(default)
        adjusted_extreme = extreme_value - center_value + 0.5
        return _clamp((0.5 + adjusted_extreme) / 2.0, 0.30, 0.70)

    def pose_threshold(
        center_value: float, extreme_value: float | None, default: float
    ) -> float:
        if extreme_value is None:
            return float(default)
        return _clamp((center_value + extreme_value) / 2.0, -35.0, 35.0)

    baseline = {
        "hRatioCenter": round(h_center, 4),
        "vRatioCenter": round(v_center, 4),
        "yawNeutral": round(yaw_center, 2),
        "pitchNeutral": round(pitch_center, 2),
        "irisLeftThreshold": round(
            iris_threshold(h_center, h_left, defaults.get("irisLeftThreshold", 0.38)), 4
        ),
        "irisRightThreshold": round(
            iris_threshold(h_center, h_right, defaults.get("irisRightThreshold", 0.62)), 4
        ),
        "irisUpThreshold": round(
            iris_threshold(v_center, v_top, defaults.get("irisUpThreshold", 0.38)), 4
        ),
        "irisDownThreshold": round(
            iris_threshold(v_center, v_bottom, defaults.get("irisDownThreshold", 0.62)), 4
        ),
        "yawLeftThreshold": round(
            pose_threshold(yaw_center, yaw_left, defaults.get("yawLeftThreshold", -15.0)), 2
        ),
        "yawRightThreshold": round(
            pose_threshold(yaw_center, yaw_right, defaults.get("yawRightThreshold", 15.0)), 2
        ),
        "pitchUpThreshold": round(
            pose_threshold(pitch_center, pitch_top, defaults.get("pitchUpThreshold", -20.0)), 2
        ),
        "pitchDownThreshold": round(
            pose_threshold(pitch_center, pitch_bottom, defaults.get("pitchDownThreshold", 20.0)),
            2,
        ),
    }

    if baseline["irisLeftThreshold"] >= baseline["irisRightThreshold"]:
        baseline["irisLeftThreshold"] = float(defaults.get("irisLeftThreshold", 0.38))
        baseline["irisRightThreshold"] = float(defaults.get("irisRightThreshold", 0.62))
    if baseline["irisUpThreshold"] >= baseline["irisDownThreshold"]:
        baseline["irisUpThreshold"] = float(defaults.get("irisUpThreshold", 0.38))
        baseline["irisDownThreshold"] = float(defaults.get("irisDownThreshold", 0.62))

    return baseline


def summarize_point_samples(
    point_samples: dict[str, list[dict[str, float]]],
) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for point_id, samples in point_samples.items():
        summary[point_id] = {
            "sampleCount": len(samples),
            "hRatio": round(_avg(samples, "hRatio") or 0.0, 4),
            "vRatio": round(_avg(samples, "vRatio") or 0.0, 4),
            "yaw": round(_avg(samples, "yaw") or 0.0, 2),
            "pitch": round(_avg(samples, "pitch") or 0.0, 2),
        }
    return summary


def derive_baseline_from_video(
    calibration: dict[str, Any],
    video_path: str | Path,
) -> dict[str, Any]:
    """Sample calibration windows in the raw recording and personalize gaze thresholds."""
    if calibration.get("skipped") or not calibration.get("completed"):
        return calibration

    point_captures = calibration.get("pointCaptures") or []
    if len(point_captures) < 5:
        logger.info("Calibration incomplete — using default gaze baseline")
        return calibration

    logger.info("Deriving gaze baseline from %s calibration windows", len(point_captures))
    point_samples = _collect_point_samples(video_path, point_captures)
    baseline = build_baseline_from_samples(point_samples)
    frame_metrics = summarize_point_samples(point_samples)

    center_count = frame_metrics.get("center", {}).get("sampleCount", 0)
    if center_count < MIN_SAMPLES_PER_POINT:
        logger.warning(
            "Insufficient center calibration samples (%s) — keeping default baseline",
            center_count,
        )
        return calibration

    updated = dict(calibration)
    updated["baseline"] = baseline
    updated["frameMetrics"] = frame_metrics
    updated["baselineSource"] = "calibration_frames"
    logger.info("Personalized gaze baseline: %s", json.dumps(baseline))
    return updated


def apply_session_calibration_baseline(
    work_dir: Path,
    video_path: str | Path,
    calibration: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Enrich calibration.json with frame-derived baselines when available."""
    from pipeline.calibration import load_calibration

    payload = calibration or load_calibration(work_dir)
    enriched = derive_baseline_from_video(payload, video_path)
    if enriched is not payload:
        save_calibration(work_dir, enriched)
    return enriched
