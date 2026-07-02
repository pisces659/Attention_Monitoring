"""Analytics and compare endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import AuthContext, require_doctor_clinic
from app.models import Session, SessionStatus
from app.serializers import session_to_json

router = APIRouter(tags=["analytics"])


@router.get("/analytics/summary")
async def analytics_summary(
    session_id: UUID | None = Query(default=None, alias="sessionId"),
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if session_id:
        session = await _get_session(db, session_id, auth.clinic_id)
    else:
        result = await db.execute(
            select(Session)
            .where(Session.clinic_id == auth.clinic_id, Session.status == SessionStatus.COMPLETED)
            .options(selectinload(Session.assessment))
            .order_by(Session.completed_at.desc())
            .limit(1)
        )
        session = result.scalar_one_or_none()

    if not session or not session.assessment:
        raise HTTPException(status_code=404, detail="No analytics available")

    data = session.assessment.summary_json
    return {
        "attentionTimeline": data.get("attentionTimeline", []),
        "blinkTimeline": data.get("blinkTimeline", []),
        "headPoseTimeline": data.get("headPoseTimeline", []),
        "speechAccuracyTimeline": data.get("speechAccuracyTimeline", []),
        "wordAccuracyTimeline": data.get("wordAccuracyTimeline", []),
        "focusDistribution": data.get("focusDistribution", []),
        "blinkBars": data.get("blinkBars", []),
        "gazeHeatmap": data.get("gazeHeatmap", []),
        "metrics": data.get("metrics", {}),
        "speechMetrics": data.get("speechMetrics", {}),
        "focusedTimeSeconds": data.get("focusedTimeSeconds", 0),
        "distractedTimeSeconds": data.get("distractedTimeSeconds", 0),
        "longestFocusDurationSeconds": data.get("longestFocusDurationSeconds", 0),
        "longestDistractionDurationSeconds": data.get("longestDistractionDurationSeconds", 0),
    }


@router.get("/sessions/compare")
async def compare_sessions(
    a: UUID = Query(...),
    b: UUID = Query(...),
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session_a = await _get_session(db, a, auth.clinic_id)
    session_b = await _get_session(db, b, auth.clinic_id)

    metrics_a = session_a.assessment.summary_json["metrics"] if session_a.assessment else {}
    metrics_b = session_b.assessment.summary_json["metrics"] if session_b.assessment else {}
    speech_a = session_a.assessment.summary_json.get("speechMetrics", {}) if session_a.assessment else {}
    speech_b = session_b.assessment.summary_json.get("speechMetrics", {}) if session_b.assessment else {}

    attention_delta = metrics_a.get("overallAttentionPercent", 0) - metrics_b.get("overallAttentionPercent", 0)
    speech_delta = speech_a.get("speechScore", 0) - speech_b.get("speechScore", 0)

    return {
        "sessionA": session_to_json(
            session_a,
            patient_name=f"{session_a.patient.first_name} {session_a.patient.last_name}",
            attention_score=metrics_a.get("overallAttentionPercent", 0),
            speech_score=speech_a.get("speechScore", 0),
            blink_count=metrics_a.get("blinkCount", 0),
        ),
        "sessionB": session_to_json(
            session_b,
            patient_name=f"{session_b.patient.first_name} {session_b.patient.last_name}",
            attention_score=metrics_b.get("overallAttentionPercent", 0),
            speech_score=speech_b.get("speechScore", 0),
            blink_count=metrics_b.get("blinkCount", 0),
        ),
        "attentionDelta": attention_delta,
        "speechDelta": speech_delta,
        "blinkDelta": metrics_a.get("blinkCount", 0) - metrics_b.get("blinkCount", 0),
        "focusDurationDelta": metrics_a.get("focusedDurationSeconds", 0)
        - metrics_b.get("focusedDurationSeconds", 0),
        "eyeContactDelta": metrics_a.get("screenEngagementPercent", 0)
        - metrics_b.get("screenEngagementPercent", 0),
        "headPoseDelta": 0,
        "improvementPercent": max(0, attention_delta),
        "regressionPercent": max(0, -attention_delta),
        "attentionTrendA": session_a.assessment.summary_json.get("attentionTimeline", [])
        if session_a.assessment
        else [],
        "attentionTrendB": session_b.assessment.summary_json.get("attentionTimeline", [])
        if session_b.assessment
        else [],
    }


async def _get_session(db: AsyncSession, session_id: UUID, clinic_id: UUID) -> Session:
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
