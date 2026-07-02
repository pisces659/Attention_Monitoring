"""Upload orchestration — manual MVP uploads; AI processing hook later."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Assessment, Report, Session, SessionStatus
from app.services.csv_parser import parse_csv_to_assessment
from app.services.storage_service import StorageService


class UploadService:
    def __init__(self) -> None:
        self.storage = StorageService()

    async def process_manual_upload(
        self,
        db: AsyncSession,
        session: Session,
        *,
        raw_video: bytes | None,
        annotated_video: bytes | None,
        csv_text: str,
        raw_filename: str | None = None,
        annotated_filename: str | None = None,
    ) -> Assessment:
        session.status = SessionStatus.UPLOADING
        await db.flush()

        urls = await self.storage.upload_session_files(
            session.id,
            raw_video=raw_video,
            annotated_video=annotated_video,
            csv_content=csv_text,
            raw_filename=raw_filename,
            annotated_filename=annotated_filename,
        )

        session.raw_video_url = urls["raw_video_url"]
        session.annotated_video_url = urls["annotated_video_url"]
        session.csv_url = urls["csv_url"]
        session.video_file_name = raw_filename
        session.processed_video_file_name = annotated_filename
        session.status = SessionStatus.PROCESSING
        await db.flush()

        assessment_json = parse_csv_to_assessment(csv_text)

        if session.assessment:
            session.assessment.summary_json = assessment_json
            assessment = session.assessment
        else:
            assessment = Assessment(session_id=session.id, summary_json=assessment_json)
            db.add(assessment)

        session.status = SessionStatus.COMPLETED

        if session.started_at is None:
            session.started_at = session.scheduled_at

        if session.completed_at is None:
            duration = assessment_json.get("durationSeconds", 0)
            base = session.started_at or session.scheduled_at
            if base and duration:
                from datetime import timedelta

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
        await db.refresh(assessment)
        return assessment
