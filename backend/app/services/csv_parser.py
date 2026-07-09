"""CSV parser — sole consumer of frame_data CSV. Produces Assessment JSON."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class SessionFrame:
    frame: int
    time: float
    face_detected: bool
    ear: float
    blink: bool
    total_blinks: int
    yaw: float
    pitch: float
    roll: float
    horizontal_gaze: str
    vertical_gaze: str
    on_screen: bool
    horizontal_ratio: float
    vertical_ratio: float
    attention_state: str


def _parse_bool(value: str) -> bool:
    return value.strip().lower() == "true"


def parse_session_csv(content: str) -> list[SessionFrame]:
    lines = content.strip().splitlines()
    rows = lines[1:] if len(lines) > 1 else []

    frames: list[SessionFrame] = []
    for row in rows:
        if not row.strip():
            continue
        columns = row.split(",")
        frames.append(
            SessionFrame(
                frame=int(columns[0]),
                time=float(columns[1]),
                face_detected=_parse_bool(columns[2]),
                ear=float(columns[7]),
                blink=_parse_bool(columns[8]),
                total_blinks=int(columns[9]),
                yaw=float(columns[10]),
                pitch=float(columns[11]),
                roll=float(columns[12]),
                horizontal_gaze=(columns[13] or "Center").strip(),
                vertical_gaze=(columns[14] or "Center").strip(),
                on_screen=_parse_bool(columns[15] if len(columns) > 15 else "false"),
                horizontal_ratio=float(columns[16]),
                vertical_ratio=float(columns[17]),
                attention_state=(columns[18] if len(columns) > 18 else "Unknown").strip(),
            )
        )
    return frames


def _is_focused(state: str) -> bool:
    return state.lower() == "focused"


def _is_distracted(state: str) -> bool:
    normalized = state.lower()
    return "looking" in normalized or "away" in normalized or normalized == "distracted"


def _seconds_per_frame(frames: list[SessionFrame]) -> float:
    if len(frames) <= 1:
        return 0.06
    return frames[-1].time / len(frames)


def _bucket_timeline(
    frames: list[SessionFrame],
    bucket_size_seconds: float,
    value_selector,
) -> list[dict[str, Any]]:
    buckets: dict[float, list[SessionFrame]] = {}
    for frame in frames:
        bucket = (int(frame.time / bucket_size_seconds)) * bucket_size_seconds
        buckets.setdefault(bucket, []).append(frame)

    return [
        {"label": f"{int(seconds)}s", "value": value_selector(bucket_frames)}
        for seconds, bucket_frames in sorted(buckets.items())
    ]


def _calculate_average_focus_duration(frames: list[SessionFrame]) -> float:
    spf = _seconds_per_frame(frames)
    current_run = 0
    total_focused = 0.0
    focused_runs = 0

    for frame in frames:
        if _is_focused(frame.attention_state):
            current_run += 1
        elif current_run > 0:
            total_focused += current_run * spf
            focused_runs += 1
            current_run = 0

    if current_run > 0:
        total_focused += current_run * spf
        focused_runs += 1

    return 0.0 if focused_runs == 0 else round(total_focused / focused_runs, 1)


def _calculate_longest_focus_duration(frames: list[SessionFrame]) -> float:
    spf = _seconds_per_frame(frames)
    current_run = 0
    longest = 0

    for frame in frames:
        if _is_focused(frame.attention_state):
            current_run += 1
            longest = max(longest, current_run)
        else:
            current_run = 0

    return round(longest * spf, 1)


def _calculate_longest_distraction_duration(frames: list[SessionFrame]) -> float:
    spf = _seconds_per_frame(frames)
    current_run = 0
    longest = 0

    for frame in frames:
        if _is_distracted(frame.attention_state):
            current_run += 1
            longest = max(longest, current_run)
        else:
            current_run = 0

    return round(longest * spf, 1)


def _count_attention_shifts(frames: list[SessionFrame]) -> int:
    shifts = 0
    for index in range(1, len(frames)):
        if frames[index].attention_state != frames[index - 1].attention_state:
            shifts += 1
    return shifts


def _build_focus_distribution(frames: list[SessionFrame]) -> list[dict[str, Any]]:
    focused = distracted = other = 0
    for frame in frames:
        if _is_focused(frame.attention_state):
            focused += 1
        elif _is_distracted(frame.attention_state):
            distracted += 1
        else:
            other += 1

    return [
        {"name": "Focused", "value": focused, "color": "#22C55E"},
        {"name": "Distracted", "value": distracted, "color": "#EF4444"},
        {"name": "Other", "value": other, "color": "#F59E0B"},
    ]


def _build_detailed_focus_distribution(frames: list[SessionFrame]) -> list[dict[str, Any]]:
    """Dashboard donut — percent per attention state."""
    counts: dict[str, int] = {}
    for frame in frames:
        counts[frame.attention_state] = counts.get(frame.attention_state, 0) + 1

    colors = {
        "Focused": "#22C55E",
        "Looking Up": "#F59E0B",
        "Looking Down": "#F97316",
        "Looking Left": "#8B5CF6",
        "Looking Right": "#EC4899",
        "Eyes Closed": "#EF4444",
        "Blink": "#8B5CF6",
    }
    total = len(frames) or 1
    return [
        {
            "name": name,
            "value": round((count / total) * 100),
            "color": colors.get(name, "#94A3B8"),
        }
        for name, count in sorted(counts.items(), key=lambda item: item[1], reverse=True)
    ]


def _build_gaze_heatmap(frames: list[SessionFrame]) -> list[dict[str, int]]:
    grid_size = 8
    cells: list[dict[str, int]] = []

    for x in range(grid_size):
        for y in range(grid_size):
            x_min, x_max = x / grid_size, (x + 1) / grid_size
            y_min, y_max = y / grid_size, (y + 1) / grid_size
            matches = [
                f
                for f in frames
                if x_min <= f.horizontal_ratio < x_max and y_min <= f.vertical_ratio < y_max
            ]
            cells.append({"x": x, "y": y, "intensity": len(matches)})

    max_intensity = max((cell["intensity"] for cell in cells), default=1)
    return [
        {
            **cell,
            "intensity": round((cell["intensity"] / max_intensity) * 100),
        }
        for cell in cells
    ]


def _build_gaze_heatmap_matrix(frames: list[SessionFrame]) -> list[list[int]]:
    grid_size = 8
    matrix: list[list[int]] = []
    for y in range(grid_size):
        row: list[int] = []
        for x in range(grid_size):
            x_min, x_max = x / grid_size, (x + 1) / grid_size
            y_min, y_max = y / grid_size, (y + 1) / grid_size
            matches = [
                f
                for f in frames
                if x_min <= f.horizontal_ratio < x_max and y_min <= f.vertical_ratio < y_max
            ]
            row.append(len(matches))
        matrix.append(row)

    flat_max = max((value for row in matrix for value in row), default=1)
    return [
        [round((value / flat_max) * 100) for value in row]
        for row in matrix
    ]


def _build_gaze_distribution(frames: list[SessionFrame]) -> list[dict[str, Any]]:
    horizontal: dict[str, int] = {}
    vertical: dict[str, int] = {}
    for frame in frames:
        horizontal[frame.horizontal_gaze] = horizontal.get(frame.horizontal_gaze, 0) + 1
        vertical[frame.vertical_gaze] = vertical.get(frame.vertical_gaze, 0) + 1

    total = len(frames) or 1
    colors = ["#2563EB", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899"]
    vertical_items = sorted(vertical.items(), key=lambda item: item[1], reverse=True)
    return [
        {
            "name": name,
            "value": round((count / total) * 100),
            "color": colors[index % len(colors)],
        }
        for index, (name, count) in enumerate(vertical_items)
    ]


def _build_attention_metrics(frames: list[SessionFrame]) -> dict[str, Any]:
    spf = _seconds_per_frame(frames)
    total_frames = len(frames)
    focused_frames = sum(1 for f in frames if _is_focused(f.attention_state))
    distracted_frames = sum(1 for f in frames if _is_distracted(f.attention_state))
    on_screen_frames = sum(1 for f in frames if f.on_screen)
    blink_frames = sum(1 for f in frames if f.blink)
    last = frames[-1] if frames else None
    duration = last.time if last else 0.0
    total_blinks = last.total_blinks if last else 0

    return {
        "overallAttentionPercent": 0 if total_frames == 0 else round((focused_frames / total_frames) * 100),
        "focusedDurationSeconds": round(focused_frames * spf, 1),
        "distractedDurationSeconds": round(distracted_frames * spf, 1),
        "attentionShifts": _count_attention_shifts(frames),
        "averageFocusDurationSeconds": _calculate_average_focus_duration(frames),
        "longestFocusDurationSeconds": _calculate_longest_focus_duration(frames),
        "eyesClosedDurationSeconds": round(blink_frames * spf, 1),
        "blinkCount": total_blinks,
        "averageBlinkRate": 0
        if duration == 0
        else round((total_blinks / duration) * 60, 1),
        "screenEngagementPercent": 0
        if total_frames == 0
        else round((on_screen_frames / total_frames) * 100),
    }


def build_assessment_json(frames: list[SessionFrame]) -> dict[str, Any]:
    """Full assessment payload stored in DB and served to frontend."""
    metrics = _build_attention_metrics(frames)
    duration = frames[-1].time if frames else 0.0

    speech_metrics = {
        "available": False,
        "speechScore": None,
        "pronunciationAccuracy": None,
        "completionPercent": None,
        "correctCount": None,
        "partialCount": None,
        "incorrectCount": None,
        "expectedWord": None,
        "detectedWord": None,
        "confidence": None,
        "responseTime": None,
        "timeline": _bucket_timeline(
            frames,
            3,
            lambda bucket: round(
                sum(1 for f in bucket if f.on_screen) / len(bucket) * 100
            ),
        ),
    }

    head_stability = round(
        100 - min(100, sum(abs(f.yaw) for f in frames) / len(frames) * 5 if frames else 0),
        1,
    )

    return {
        "totalFrames": len(frames),
        "durationSeconds": round(duration, 3),
        "metrics": metrics,
        "speechMetrics": speech_metrics,
        "attentionTimeline": _bucket_timeline(
            frames,
            2,
            lambda bucket: round(
                sum(1 for f in bucket if _is_focused(f.attention_state)) / len(bucket) * 100
            ),
        ),
        "blinkTimeline": _bucket_timeline(
            frames, 2, lambda bucket: sum(1 for f in bucket if f.blink)
        ),
        "headPoseTimeline": _bucket_timeline(
            frames,
            2,
            lambda bucket: round(
                sum(abs(f.yaw) for f in bucket) / len(bucket), 1
            ),
        ),
        "speechAccuracyTimeline": speech_metrics["timeline"],
        "wordAccuracyTimeline": _bucket_timeline(
            frames,
            3,
            lambda bucket: round(
                sum(1 for f in bucket if f.on_screen) / len(bucket) * 100
            ),
        ),
        "focusDistribution": _build_focus_distribution(frames),
        "detailedFocusDistribution": _build_detailed_focus_distribution(frames),
        "blinkBars": _bucket_timeline(
            frames, 2, lambda bucket: bucket[-1].total_blinks if bucket else 0
        ),
        "gazeHeatmap": _build_gaze_heatmap(frames),
        "gazeHeatmapMatrix": _build_gaze_heatmap_matrix(frames),
        "gazeDistribution": _build_gaze_distribution(frames),
        "focusedTimeSeconds": metrics["focusedDurationSeconds"],
        "distractedTimeSeconds": metrics["distractedDurationSeconds"],
        "longestFocusDurationSeconds": metrics["longestFocusDurationSeconds"],
        "longestDistractionDurationSeconds": _calculate_longest_distraction_duration(frames),
        "headStabilityScore": head_stability,
        "engagementScore": min(100, round(metrics["overallAttentionPercent"] * 0.7 + head_stability * 0.3)),
        "engagementLabel": "Good"
        if metrics["overallAttentionPercent"] >= 60
        else "Moderate"
        if metrics["overallAttentionPercent"] >= 35
        else "Low",
        "latestFrame": {
            "timeSec": frames[-1].time if frames else 0,
            "attentionState": frames[-1].attention_state if frames else "Unknown",
            "ear": round(frames[-1].ear, 4) if frames else 0,
            "blink": frames[-1].blink if frames else False,
            "totalBlinks": frames[-1].total_blinks if frames else 0,
            "yaw": round(frames[-1].yaw, 2) if frames else 0,
            "pitch": round(frames[-1].pitch, 2) if frames else 0,
            "horizontalGaze": frames[-1].horizontal_gaze if frames else "Center",
            "verticalGaze": frames[-1].vertical_gaze if frames else "Center",
            "onScreen": frames[-1].on_screen if frames else False,
        },
    }


def parse_csv_to_assessment(content: str) -> dict[str, Any]:
    frames = parse_session_csv(content)
    return build_assessment_json(frames)


def apply_pipeline_speech_metrics(
    assessment: dict[str, Any],
    pipeline_summary: dict[str, Any],
) -> dict[str, Any]:
    """Merge speech results from the Ram pipeline into assessment JSON."""
    speech = dict(assessment.get("speechMetrics", {}))
    score = pipeline_summary.get("SpeechScore")
    speech.update(
        {
            "available": True,
            "speechScore": int(score) if score is not None else None,
            "pronunciationAccuracy": int(score) if score is not None else None,
            "completionPercent": 100 if pipeline_summary.get("SpeechFound") else 0,
            "correctCount": 1 if pipeline_summary.get("SpeechFound") else 0,
            "partialCount": 0 if pipeline_summary.get("SpeechFound") else 1,
            "incorrectCount": 0,
            "expectedWord": pipeline_summary.get("ExpectedWord"),
            "detectedWord": pipeline_summary.get("RecognizedWord") or None,
            "confidence": score,
            "responseTime": pipeline_summary.get("ResponseTime"),
        }
    )
    assessment["speechMetrics"] = speech
    return assessment
