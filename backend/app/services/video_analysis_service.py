"""Runs the Ram-branch video pipeline in a worker thread."""

from __future__ import annotations

import asyncio
import logging
import shutil
from pathlib import Path
from typing import TYPE_CHECKING
from uuid import UUID

if TYPE_CHECKING:
    from pipeline.analyze import AnalysisResult

logger = logging.getLogger(__name__)
_BACKEND_ROOT = Path(__file__).resolve().parents[2]


def processing_dir(session_id: UUID) -> Path:
    path = _BACKEND_ROOT / "uploads" / "processing" / str(session_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_input_video(session_id: UUID, video_bytes: bytes, filename: str | None) -> Path:
    work_dir = processing_dir(session_id)
    ext = Path(filename or "video.mp4").suffix or ".mp4"
    input_path = work_dir / f"input{ext}"
    input_path.write_bytes(video_bytes)
    return input_path


def run_analysis_sync(
    input_path: Path,
    session_id: UUID,
    *,
    expected_words: list[str],
) -> AnalysisResult:
    from pipeline.analyze import analyze_video
    from pipeline.calibration import analysis_start_seconds, load_calibration
    from app.services.upload_service import UploadService

    output_dir = processing_dir(session_id) / "output"
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    work_dir = processing_dir(session_id)
    calibration = load_calibration(work_dir)
    trim_start = analysis_start_seconds(calibration)
    if trim_start > 0:
        logger.info(
            "Session %s: trimming annotated output to stimulus start at %.2fs",
            session_id,
            trim_start,
        )

    focus_areas: list[dict] = []
    stimulus_meta_path = work_dir / "stimulus_meta.json"
    if stimulus_meta_path.exists():
        try:
            import json

            stimulus_meta = json.loads(stimulus_meta_path.read_text(encoding="utf-8"))
            focus_areas = stimulus_meta.get("focusAreas") or []
        except (OSError, json.JSONDecodeError):
            focus_areas = []

    resolved_words = expected_words
    if focus_areas:
        focus_keywords = UploadService._keywords_from_focus_areas(focus_areas)
        if focus_keywords:
            resolved_words = focus_keywords

    logger.info("Running video analysis for session %s", session_id)
    return analyze_video(
        input_path,
        output_dir,
        expected_word=", ".join(resolved_words),
        expected_words=resolved_words,
        focus_areas=focus_areas or None,
        analysis_start_seconds=trim_start,
    )


async def run_analysis(
    input_path: Path,
    session_id: UUID,
    *,
    expected_words: list[str],
) -> AnalysisResult:
    return await asyncio.to_thread(
        run_analysis_sync,
        input_path,
        session_id,
        expected_words=expected_words,
    )
