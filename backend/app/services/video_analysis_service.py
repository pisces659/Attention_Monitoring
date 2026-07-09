"""Runs the Ram-branch video pipeline in a worker thread."""

from __future__ import annotations

import asyncio
import shutil
from pathlib import Path
from uuid import UUID

from pipeline.analyze import AnalysisResult, analyze_video

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
    expected_word: str,
) -> AnalysisResult:
    output_dir = processing_dir(session_id) / "output"
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    return analyze_video(input_path, output_dir, expected_word=expected_word)


async def run_analysis(
    input_path: Path,
    session_id: UUID,
    *,
    expected_word: str,
) -> AnalysisResult:
    return await asyncio.to_thread(
        run_analysis_sync,
        input_path,
        session_id,
        expected_word=expected_word,
    )
