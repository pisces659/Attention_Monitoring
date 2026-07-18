"""Upload orchestration — video in, annotated video + CSV + assessment out."""

from __future__ import annotations

import json
import logging
from datetime import timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import SessionLocal
from app.models import Assessment, Report, Session, SessionStatus, StimulusVideo
from app.services.csv_parser import apply_pipeline_speech_metrics, parse_csv_to_assessment
from app.services.storage_service import StorageService
from pipeline.calibration import analysis_start_seconds, save_calibration
from pipeline.ffmpeg_utils import trim_video_segment
from pipeline.modules.audio.similarity import parse_expected_words

from app.services.video_analysis_service import (
    processing_dir,
    run_analysis,
    save_input_video,
)

logger = logging.getLogger(__name__)
DEFAULT_KEYWORDS = ["red", "square", "elephant", "green", "star"]


class UploadService:
    def __init__(self) -> None:
        self.storage = StorageService()

    async def start_video_upload(
        self,
        db: AsyncSession,
        session: Session,
        *,
        video: bytes,
        filename: str | None,
        expected_word: str | None = None,
        expected_words: list[str] | None = None,
        calibration_json: str | None = None,
        stimulus_video_id: str | None = None,
    ) -> Session:
        session.status = SessionStatus.UPLOADING
        await db.flush()

        input_path = save_input_video(session.id, video, filename)
        urls = await self.storage.upload_session_files(
            session.id,
            raw_video=video,
            raw_filename=filename or input_path.name,
        )

        session.raw_video_url = urls["raw_video_url"]
        session.video_file_name = filename or input_path.name
        session.status = SessionStatus.PROCESSING

        stimulus_meta = await self._resolve_stimulus_meta(
            db, stimulus_video_id=stimulus_video_id
        )
        if stimulus_video_id and stimulus_video_id != "builtin-identification":
            try:
                session.stimulus_video_id = UUID(stimulus_video_id)
            except ValueError:
                session.stimulus_video_id = None

        words = self._resolve_expected_words(
            expected_words,
            expected_word,
            stimulus_meta.get("keywords"),
            stimulus_meta.get("focusAreas"),
        )
        word_blob = ", ".join(words)
        work_dir = processing_dir(session.id)
        work_dir.mkdir(parents=True, exist_ok=True)
        (work_dir / "expected_word.txt").write_text(word_blob, encoding="utf-8")
        (work_dir / "stimulus_meta.json").write_text(
            json.dumps(stimulus_meta, indent=2), encoding="utf-8"
        )

        calibration = save_calibration(work_dir, calibration_json)
        trim_start = analysis_start_seconds(calibration)
        if trim_start > 0:
            try:
                trim_video_segment(
                    input_path,
                    work_dir / "stimulus_segment.webm",
                    start_seconds=trim_start,
                )
            except RuntimeError as exc:
                logger.warning("Could not extract stimulus segment: %s", exc)

        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    def _keywords_from_focus_areas(focus_areas: list[dict] | None) -> list[str]:
        if not focus_areas:
            return []
        return [kw for area in focus_areas for kw in area.get("keywords", [])]

    @staticmethod
    def _resolve_expected_words(
        expected_words: list[str] | None,
        expected_word: str | None,
        stimulus_keywords: list[str] | None,
        focus_areas: list[dict] | None = None,
    ) -> list[str]:
        from_focus = UploadService._keywords_from_focus_areas(focus_areas)
        if from_focus:
            return from_focus
        if stimulus_keywords:
            return stimulus_keywords
        if expected_words:
            words = parse_expected_words(expected_words)
            if words:
                return words
        if expected_word and expected_word.strip():
            words = parse_expected_words(expected_word.strip())
            if words:
                return words
        return list(DEFAULT_KEYWORDS)

    @staticmethod
    async def _resolve_stimulus_meta(
        db: AsyncSession, *, stimulus_video_id: str | None
    ) -> dict:
        from app.routers.stimulus_videos import BUILTIN_DEFAULT

        if not stimulus_video_id or stimulus_video_id == BUILTIN_DEFAULT["id"]:
            return {
                "id": BUILTIN_DEFAULT["id"],
                "title": BUILTIN_DEFAULT["title"],
                "keywords": BUILTIN_DEFAULT["keywords"],
                "focusAreas": BUILTIN_DEFAULT["focusAreas"],
                "durationMs": BUILTIN_DEFAULT["durationMs"],
            }

        try:
            parsed_id = UUID(stimulus_video_id)
        except ValueError:
            return {
                "id": BUILTIN_DEFAULT["id"],
                "keywords": BUILTIN_DEFAULT["keywords"],
                "focusAreas": BUILTIN_DEFAULT["focusAreas"],
            }

        video = await db.get(StimulusVideo, parsed_id)
        if not video or not video.is_active:
            return {
                "id": BUILTIN_DEFAULT["id"],
                "keywords": BUILTIN_DEFAULT["keywords"],
                "focusAreas": BUILTIN_DEFAULT["focusAreas"],
            }

        return {
            "id": str(video.id),
            "title": video.title,
            "keywords": video.keywords or [],
            "focusAreas": video.focus_areas or [],
            "durationMs": video.duration_ms,
            "videoUrl": video.video_url,
        }

    async def run_video_analysis(self, session_id: UUID) -> None:
        async with SessionLocal() as db:
            session = await self._load_session(db, session_id)
            if not session:
                return

            work_dir = processing_dir(session_id)
            input_files = sorted(work_dir.glob("input.*"))
            if not input_files:
                await self._mark_failed(db, session, "Input video not found for analysis.")
                return

            try:
                logger.info("Background analysis started for session %s", session_id)
                expected_word_path = work_dir / "expected_word.txt"
                expected_words = (
                    parse_expected_words(expected_word_path.read_text(encoding="utf-8").strip())
                    if expected_word_path.exists()
                    else list(DEFAULT_KEYWORDS)
                )
                if not expected_words:
                    expected_words = list(DEFAULT_KEYWORDS)
                result = await run_analysis(
                    input_files[0],
                    session_id,
                    expected_words=expected_words,
                )

                csv_text = result.csv_path.read_text(encoding="utf-8")
                annotated_bytes = result.annotated_video_path.read_bytes()

                urls = await self.storage.upload_session_files(
                    session_id,
                    annotated_video=annotated_bytes,
                    annotated_filename="annotated.mp4",
                    csv_content=csv_text,
                )

                session.annotated_video_url = urls["annotated_video_url"]
                session.csv_url = urls["csv_url"]
                session.processed_video_file_name = "annotated.mp4"
                session.status = SessionStatus.PROCESSING
                await db.flush()

                assessment_json = parse_csv_to_assessment(csv_text)
                assessment_json = apply_pipeline_speech_metrics(
                    assessment_json,
                    result.pipeline_summary,
                )

                if session.assessment:
                    session.assessment.summary_json = assessment_json
                else:
                    db.add(Assessment(session_id=session.id, summary_json=assessment_json))

                session.status = SessionStatus.COMPLETED

                if session.started_at is None:
                    session.started_at = session.scheduled_at

                if session.completed_at is None:
                    duration = assessment_json.get("durationSeconds", 0)
                    base = session.started_at or session.scheduled_at
                    if base and duration:
                        session.completed_at = base + timedelta(seconds=float(duration))
                    elif base:
                        session.completed_at = base

                if session.report is None:
                    metrics = assessment_json["metrics"]
                    report = Report(
                        session_id=session.id,
                        patient_id=session.patient_id,
                        title="Session Report",
                        summary=(
                            f"Attention score {metrics['overallAttentionPercent']}%. "
                            f"Focused for {metrics['focusedDurationSeconds']}s with "
                            f"{metrics['blinkCount']} blinks recorded."
                        ),
                        recommendations=[
                            "Continue structured visual attention exercises.",
                            "Monitor blink rate during sustained focus tasks.",
                        ],
                    )
                    db.add(report)

                await db.commit()
                logger.info("Background analysis completed for session %s", session_id)
            except Exception as exc:
                logger.exception("Video analysis failed for session %s", session_id)
                message = str(exc).encode("utf-8", errors="replace").decode("utf-8")
                await self._mark_failed(db, session, message)

    async def _load_session(self, db: AsyncSession, session_id: UUID) -> Session | None:
        result = await db.execute(
            select(Session)
            .where(Session.id == session_id)
            .options(
                selectinload(Session.assessment),
                selectinload(Session.report),
            )
        )
        return result.scalar_one_or_none()

    async def _mark_failed(self, db: AsyncSession, session: Session, detail: str) -> None:
        session.status = SessionStatus.FAILED
        session.doctor_notes = (
            f"{session.doctor_notes}\n\nAnalysis failed: {detail}".strip()
            if session.doctor_notes
            else f"Analysis failed: {detail}"
        )
        await db.commit()
