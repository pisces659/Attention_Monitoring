"""Report endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import AuthContext, require_doctor_clinic
from app.models import Report, Session
from app.serializers import report_to_json, session_to_json, patient_to_json

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
async def list_reports(
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(Report)
        .join(Session)
        .where(Session.clinic_id == auth.clinic_id)
        .options(
            selectinload(Report.session).selectinload(Session.patient),
            selectinload(Report.session).selectinload(Session.assessment),
        )
        .order_by(Report.created_at.desc())
    )
    reports = result.scalars().all()
    output = []
    for report in reports:
        session = report.session
        metrics = session.assessment.summary_json["metrics"] if session.assessment else {}
        speech = session.assessment.summary_json.get("speechMetrics", {}) if session.assessment else {}
        output.append(
            report_to_json(
                report,
                patient_name=f"{session.patient.first_name} {session.patient.last_name}",
                attention_score=metrics.get("overallAttentionPercent", 0),
                speech_score=speech.get("speechScore", 0),
                event_time=session.completed_at
                or session.started_at
                or session.scheduled_at
                or session.created_at,
                session_display_id=session.display_id or "",
            )
        )
    return output


@router.get("/{report_id}")
async def get_report(
    report_id: UUID,
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _build_session_report(db, report_id, auth.clinic_id)


@router.get("/{report_id}/full")
async def get_full_session_report(
    report_id: UUID,
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _build_session_report(db, report_id, auth.clinic_id)


async def _build_session_report(db: AsyncSession, report_id: UUID, clinic_id: UUID) -> dict:
    result = await db.execute(
        select(Report)
        .join(Session)
        .where(Report.id == report_id, Session.clinic_id == clinic_id)
        .options(
            selectinload(Report.session).selectinload(Session.patient),
            selectinload(Report.session).selectinload(Session.assessment),
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    session = report.session
    patient = session.patient
    assessment = session.assessment.summary_json if session.assessment else {}
    metrics = assessment.get("metrics", {})
    speech_metrics = assessment.get("speechMetrics", {})

    return {
        "report": report_to_json(
            report,
            patient_name=f"{patient.first_name} {patient.last_name}",
            attention_score=metrics.get("overallAttentionPercent", 0),
            speech_score=speech_metrics.get("speechScore", 0),
            event_time=session.completed_at or session.created_at,
            session_display_id=session.display_id or "",
        ),
        "session": session_to_json(
            session,
            patient_name=f"{patient.first_name} {patient.last_name}",
            attention_score=metrics.get("overallAttentionPercent", 0),
            speech_score=speech_metrics.get("speechScore", 0),
            blink_count=metrics.get("blinkCount", 0),
            report_id=str(report.id),
        ),
        "patient": patient_to_json(patient, doctor_name=""),
        "attentionMetrics": metrics,
        "speechMetrics": speech_metrics,
        "speechWords": [],
        "attentionTimeline": assessment.get("attentionTimeline", []),
        "blinkTimeline": assessment.get("blinkTimeline", []),
        "headPoseTimeline": assessment.get("headPoseTimeline", []),
        "focusDistribution": assessment.get("focusDistribution", []),
        "recommendations": report.recommendations or [],
    }
