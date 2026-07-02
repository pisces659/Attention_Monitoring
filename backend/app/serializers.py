"""Map DB entities to frontend-compatible JSON shapes."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from app.models import Patient, Report, Session, SessionStatus


def _format_date_label(value: datetime) -> str:
    if not value:
        return ""
    return f"{value.strftime('%b %d, %Y, ')}{value.strftime('%I:%M %p').lstrip('0')}"


def _calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _map_session_status(status: SessionStatus) -> str:
    mapping = {
        SessionStatus.CREATED: "scheduled",
        SessionStatus.UPLOADING: "in-progress",
        SessionStatus.UPLOADED: "in-progress",
        SessionStatus.PROCESSING: "processing",
        SessionStatus.COMPLETED: "completed",
        SessionStatus.FAILED: "completed",
    }
    return mapping.get(status, "scheduled")


def _attention_level(score: int) -> str:
    if score >= 80:
        return "focused"
    if score >= 60:
        return "moderate"
    return "distracted"


def patient_to_json(
    patient: Patient,
    *,
    doctor_name: str = "",
    session_count: int = 0,
    last_session: Optional[datetime] = None,
    average_attention: float = 0,
    average_speech: float = 0,
) -> dict[str, Any]:
    last = last_session or patient.created_at
    return {
        "id": str(patient.id),
        "displayId": patient.display_id or "",
        "firstName": patient.first_name,
        "lastName": patient.last_name,
        "age": _calculate_age(patient.dob),
        "gender": patient.gender,
        "diagnosis": patient.diagnosis or "",
        "doctor": doctor_name,
        "notes": patient.notes or "",
        "createdDate": patient.created_at.isoformat(),
        "avatarInitials": (
            patient.display_id[:2]
            if patient.display_id and len(patient.display_id) >= 2
            else f"{patient.first_name[0]}{patient.last_name[0]}"
        ),
        "sessionCount": session_count,
        "lastSessionDate": last.isoformat() if last else patient.created_at.isoformat(),
        "lastSessionLabel": _format_date_label(last) if last else "",
        "averageAttention": round(average_attention),
        "averageSpeech": round(average_speech),
    }


def _session_event_time(session: Session) -> datetime:
    return (
        session.completed_at
        or session.started_at
        or session.scheduled_at
        or session.created_at
    )


def _session_kind(session: Session) -> str:
    if session.status == SessionStatus.COMPLETED or session.csv_url:
        return "pre_recorded"
    if session.started_at and session.status != SessionStatus.CREATED:
        return "pre_recorded"
    return "scheduled"


def _session_duration_minutes(session: Session) -> int:
    if session.completed_at and session.started_at:
        return max(1, round((session.completed_at - session.started_at).total_seconds() / 60))
    if session.scheduled_at and session.completed_at:
        return max(1, round((session.completed_at - session.scheduled_at).total_seconds() / 60))
    return 15


def session_to_json(
    session: Session,
    *,
    patient_name: str,
    attention_score: int = 0,
    speech_score: int = 0,
    blink_count: int = 0,
    report_id: Optional[str] = None,
) -> dict[str, Any]:
    event_time = _session_event_time(session)
    patient_display_id = ""
    if getattr(session, "patient", None) and session.patient.display_id:
        patient_display_id = session.patient.display_id
    return {
        "id": str(session.id),
        "displayId": session.display_id or "",
        "patientId": str(session.patient_id),
        "patientDisplayId": patient_display_id,
        "patientName": patient_name,
        "date": event_time.isoformat(),
        "dateLabel": _format_date_label(event_time),
        "durationMinutes": _session_duration_minutes(session),
        "attentionScore": attention_score,
        "speechScore": speech_score,
        "status": _map_session_status(session.status),
        "sessionKind": _session_kind(session),
        "sessionAt": event_time.isoformat(),
        "scheduledAt": session.scheduled_at.isoformat() if session.scheduled_at else None,
        "attentionLevel": _attention_level(attention_score),
        "blinkCount": blink_count,
        "doctorNotes": session.doctor_notes or "",
        "hasCsvOutput": bool(session.csv_url),
        "videoFileName": session.video_file_name,
        "processedVideoFileName": session.processed_video_file_name,
        "rawVideoUrl": session.raw_video_url,
        "annotatedVideoUrl": session.annotated_video_url,
        "reportId": report_id,
    }


def report_to_json(
    report: Report,
    *,
    patient_name: str,
    attention_score: int,
    speech_score: int,
    event_time: datetime,
    session_display_id: str = "",
) -> dict[str, Any]:
    return {
        "id": str(report.id),
        "sessionId": str(report.session_id),
        "sessionDisplayId": session_display_id or "",
        "patientId": str(report.patient_id),
        "patientName": patient_name,
        "title": report.title,
        "date": event_time.isoformat(),
        "dateLabel": _format_date_label(event_time),
        "attentionScore": attention_score,
        "speechScore": speech_score,
        "summary": report.summary or "",
        "recommendations": report.recommendations or [],
    }
