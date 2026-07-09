"""Upload orchestration — video in, annotated video + CSV + assessment out."""

from __future__ import annotations

import logging
from datetime import timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import SessionLocal
from app.models import Assessment, Report, Session, SessionStatus
from app.services.csv_parser import apply_pipeline_speech_metrics, parse_csv_to_assessment
from app.services.storage_service import StorageService
from app.services.video_analysis_service import (
    processing_dir,
    run_analysis,
    save_input_video,
)

logger = logging.getLogger(__name__)
DEFAULT_EXPECTED_WORD = "Elephant"


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
        word = (expected_word or DEFAULT_EXPECTED_WORD).strip() or DEFAULT_EXPECTED_WORD
        (work_dir := processing_dir(session.id)).mkdir(parents=True, exist_ok=True)
        (work_dir / "expected_word.txt").write_text(word, encoding="utf-8")
        await db.commit()
        await db.refresh(session)
        return session

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
                expected_word = (
                    expected_word_path.read_text(encoding="utf-8").strip()
                    if expected_word_path.exists()
                    else DEFAULT_EXPECTED_WORD
                )
                result = await run_analysis(
                    input_files[0],
                    session_id,
                    expected_word=expected_word,
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
