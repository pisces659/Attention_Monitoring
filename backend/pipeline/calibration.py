"""Per-session gaze calibration profiles."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DEFAULT_CALIBRATION: dict[str, Any] = {
    "version": 1,
    "source": "default",
    "skipped": True,
    "completed": False,
    "baseline": {
        "hRatioCenter": 0.5,
        "vRatioCenter": 0.5,
        "yawNeutral": 0.0,
        "pitchNeutral": 0.0,
        "irisLeftThreshold": 0.38,
        "irisRightThreshold": 0.62,
        "irisUpThreshold": 0.38,
        "irisDownThreshold": 0.62,
        "yawLeftThreshold": -15.0,
        "yawRightThreshold": 15.0,
        "pitchUpThreshold": -20.0,
        "pitchDownThreshold": 20.0,
    },
    "pointCaptures": [],
}


def analysis_start_seconds(calibration: dict[str, Any]) -> float:
    """Seconds into the raw recording where stimulus / analysis begins."""
    raw_ms = calibration.get("analysisStartMs", calibration.get("stimulusStartMs", 0))
    try:
        return max(0.0, float(raw_ms) / 1000.0)
    except (TypeError, ValueError):
        return 0.0


def load_calibration(work_dir: Path) -> dict[str, Any]:
    calibration_path = work_dir / "calibration.json"
    if not calibration_path.exists():
        return dict(DEFAULT_CALIBRATION)

    try:
        payload = json.loads(calibration_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return dict(DEFAULT_CALIBRATION)

    if not isinstance(payload, dict):
        return dict(DEFAULT_CALIBRATION)
    return payload


def save_calibration(work_dir: Path, payload: dict[str, Any] | str | None) -> dict[str, Any]:
    work_dir.mkdir(parents=True, exist_ok=True)
    if not payload:
        calibration = dict(DEFAULT_CALIBRATION)
    elif isinstance(payload, str):
        try:
            parsed = json.loads(payload)
        except json.JSONDecodeError:
            parsed = {}
        calibration = parsed if isinstance(parsed, dict) else dict(DEFAULT_CALIBRATION)
    else:
        calibration = payload

    if "baseline" not in calibration:
        calibration["baseline"] = dict(DEFAULT_CALIBRATION["baseline"])

    (work_dir / "calibration.json").write_text(
        json.dumps(calibration, indent=2),
        encoding="utf-8",
    )
    return calibration
