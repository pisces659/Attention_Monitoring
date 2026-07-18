"""Session endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import AuthContext, require_doctor_clinic
from app.models import Patient, PatientClinic, Session, SessionStatus
from app.serializers import session_to_json
from app.services.clinic_scope import get_doctor_clinic_ids
from app.services.display_ids import allocate_session_display_id
from app.services.upload_service import UploadService

router = APIRouter(prefix="/sessions", tags=["sessions"])


class SessionKind(str, Enum):
    PRE_RECORDED = "pre_recorded"
    SCHEDULED = "scheduled"


class SessionCreate(BaseModel):
    patient_id: str = Field(alias="patientId")
    doctor_notes: str = Field(default="", alias="doctorNotes")
    session_kind: SessionKind = Field(alias="sessionKind")
    session_at: datetime = Field(alias="sessionAt")

    model_config = {"populate_by_name": True}


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _scores_from_session(session: Session) -> tuple[int, int, int]:
    if not session.assessment:
        return 0, 0, 0
    metrics = session.assessment.summary_json["metrics"]
    speech = session.assessment.summary_json.get("speechMetrics", {})
    speech_score = (
        int(speech["speechScore"])
        if speech.get("available") and speech.get("speechScore") is not None
        else 0
    )
    return (
        metrics["overallAttentionPercent"],
        speech_score,
        metrics["blinkCount"],
    )


@router.get("")
async def list_sessions(
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(Session)
        .where(Session.clinic_id == auth.clinic_id)
        .options(
            selectinload(Session.patient),
            selectinload(Session.assessment),
            selectinload(Session.report),
        )
        .order_by(Session.created_at.desc())
    )
    sessions = result.scalars().all()
    return [
        session_to_json(
            session,
            patient_name=f"{session.patient.first_name} {session.patient.last_name}",
            attention_score=_scores_from_session(session)[0],
            speech_score=_scores_from_session(session)[1],
            blink_count=_scores_from_session(session)[2],
            report_id=str(session.report.id) if session.report else None,
        )
        for session in sessions
    ]


@router.get("/{session_id}")
async def get_session(
    session_id: UUID,
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session = await _get_clinic_session(db, session_id, auth.clinic_id)
    scores = _scores_from_session(session)
    return session_to_json(
        session,
        patient_name=f"{session.patient.first_name} {session.patient.last_name}",
        attention_score=scores[0],
        speech_score=scores[1],
        blink_count=scores[2],
        report_id=str(session.report.id) if session.report else None,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: SessionCreate,
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if auth.doctor is None:
        raise HTTPException(status_code=400, detail="Doctor profile required")

    clinic_ids = await get_doctor_clinic_ids(db, auth)
    patient_result = await db.execute(
        select(Patient)
        .join(PatientClinic)
        .where(Patient.id == UUID(payload.patient_id), PatientClinic.clinic_id.in_(clinic_ids))
    )
    patient = patient_result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    session_at = _ensure_utc(payload.session_at)
    display_id = await allocate_session_display_id(db)

    if payload.session_kind == SessionKind.SCHEDULED:
        session = Session(
            display_id=display_id,
            patient_id=patient.id,
            doctor_id=auth.doctor.id,
            clinic_id=auth.clinic_id,
            status=SessionStatus.CREATED,
            doctor_notes=payload.doctor_notes,
            scheduled_at=session_at,
        )
    else:
        session = Session(
            display_id=display_id,
            patient_id=patient.id,
            doctor_id=auth.doctor.id,
            clinic_id=auth.clinic_id,
            status=SessionStatus.CREATED,
            doctor_notes=payload.doctor_notes,
            scheduled_at=session_at,
            started_at=session_at,
        )

    db.add(session)
    await db.commit()
    await db.refresh(session, attribute_names=["patient"])
    return session_to_json(
        session,
        patient_name=f"{patient.first_name} {patient.last_name}",
    )


@router.post("/{session_id}/upload")
async def upload_session_files(
    session_id: UUID,
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    expected_word: str = Form(default=""),
    expected_words: str = Form(default=""),
    calibration_json: str = Form(default=""),
    stimulus_video_id: str = Form(default=""),
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session = await _get_clinic_session(db, session_id, auth.clinic_id)
    video_bytes = await video.read()
    if not video_bytes:
        raise HTTPException(status_code=400, detail="Video file is required.")

    words_input = (expected_words or expected_word or "").strip() or None

    upload_service = UploadService()
    await upload_service.start_video_upload(
        db,
        session,
        video=video_bytes,
        filename=video.filename,
        expected_word=words_input,
        calibration_json=calibration_json or None,
        stimulus_video_id=stimulus_video_id or None,
    )
    background_tasks.add_task(upload_service.run_video_analysis, session_id)

    await db.refresh(session, attribute_names=["patient", "assessment", "report"])
    scores = _scores_from_session(session)
    return session_to_json(
        session,
        patient_name=f"{session.patient.first_name} {session.patient.last_name}",
        attention_score=scores[0],
        speech_score=scores[1],
        blink_count=scores[2],
        report_id=str(session.report.id) if session.report else None,
    )


async def _get_clinic_session(db: AsyncSession, session_id: UUID, clinic_id: UUID) -> Session:
    result = await db.execute(
        select(Session)
        .where(Session.id == session_id, Session.clinic_id == clinic_id)
        .options(
            selectinload(Session.patient),
            selectinload(Session.assessment),
            selectinload(Session.report),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
