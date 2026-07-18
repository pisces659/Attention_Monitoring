"""Build Patient Time History dashboard JSON from DB data."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from app.models import Assessment, Patient, Session, SessionStatus


def _format_short_date(value: datetime) -> str:
    return value.strftime("%d %b %Y")


def _format_time(value: datetime) -> str:
    return value.strftime("%I:%M %p").lstrip("0")


def _session_event_time(session: Session) -> datetime:
    return (
        session.completed_at
        or session.started_at
        or session.scheduled_at
        or session.created_at
    )


def _normalize_focus_distribution(detailed_focus: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if detailed_focus and detailed_focus[0].get("value", 0) > 100:
        total = sum(item["value"] for item in detailed_focus) or 1
        return [
            {**item, "value": round((item["value"] / total) * 100)} for item in detailed_focus
        ]
    return detailed_focus


def _build_speech_payload(speech: dict[str, Any]) -> dict[str, Any]:
    speech_available = bool(speech.get("available"))
    speech_matches = speech.get("matches") or []
    speech_other_words = speech.get("otherWords") or []
    expected_words = speech.get("expectedWords") or []
    if not expected_words and speech.get("expectedWord"):
        expected_words = [
            word.strip()
            for word in str(speech["expectedWord"]).split(",")
            if word.strip()
        ]
    if not speech_matches and expected_words:
        speech_matches = [
            {
                "expectedWord": word,
                "detectedWord": speech.get("detectedWord"),
                "confidence": speech.get("confidence") or 0,
                "responseTime": speech.get("responseTime") or "—",
            }
            for word in expected_words[:1]
        ]
    return {
        "speech_available": speech_available,
        "speech_matches": speech_matches,
        "speech_other_words": speech_other_words,
        "expected_words": expected_words,
        "expected_word": speech.get("expectedWord")
        or ("N/A" if not speech_available else "—"),
        "detected_word": speech.get("detectedWord")
        or ("N/A" if not speech_available else "—"),
        "confidence": speech.get("confidence") if speech_available else None,
        "response_time": speech.get("responseTime")
        or ("N/A" if not speech_available else "—"),
    }


def _build_analytics_footer(data: dict[str, Any], metrics: dict[str, Any]) -> dict[str, Any]:
    return {
        "gazeHeatmap": data.get("gazeHeatmapMatrix", []),
        "gazeDistribution": data.get("gazeDistribution", []),
        "totalBlinks": metrics["blinkCount"],
        "blinkRate": f"{metrics['averageBlinkRate']}/min",
        "headStabilityScore": data.get("headStabilityScore", 0),
        "headMovementLevel": "Low"
        if data.get("headStabilityScore", 0) >= 85
        else "Moderate",
        "headMovementTrend": data.get("headPoseTimeline", []),
        "engagementScore": data.get("engagementScore", 0),
        "engagementLabel": data.get("engagementLabel", "Moderate"),
    }


def _build_session_detail(session: Session, data: dict[str, Any]) -> dict[str, Any]:
    metrics = data["metrics"]
    latest_frame = data.get("latestFrame", {})
    speech_payload = _build_speech_payload(data.get("speechMetrics", {}))
    detailed_focus = _normalize_focus_distribution(
        data.get("detailedFocusDistribution") or data.get("focusDistribution", [])
    )
    event = _session_event_time(session)

    session_payload = {
        "sessionId": str(session.id),
        "sessionDisplayId": session.display_id or "",
        "reportId": str(session.report.id) if session.report else None,
        "dateLabel": _format_short_date(event),
        "attentionStatus": latest_frame.get("attentionState", "Unknown"),
        "ear": str(latest_frame.get("ear", 0)),
        "blink": "Yes" if latest_frame.get("blink") else "No",
        "yaw": f"{latest_frame.get('yaw', 0)}°",
        "pitch": f"{latest_frame.get('pitch', 0)}°",
        "totalTimeSeconds": data.get("durationSeconds", 0),
        "focusDistribution": detailed_focus,
        "focusTime": f"{metrics['focusedDurationSeconds']} sec",
        "attentionDrifts": metrics["attentionShifts"],
        "longestFocus": f"{metrics['longestFocusDurationSeconds']} sec",
        "expectedWord": speech_payload["expected_word"],
        "expectedWords": speech_payload["expected_words"],
        "detectedWord": speech_payload["detected_word"],
        "confidence": speech_payload["confidence"],
        "responseTime": speech_payload["response_time"],
        "speechMatches": speech_payload["speech_matches"],
        "speechOtherWords": speech_payload["speech_other_words"],
        "speechAvailable": speech_payload["speech_available"],
        "doctorNotes": session.doctor_notes or "",
        "rawVideoFileName": session.video_file_name or "",
        "annotatedVideoFileName": session.processed_video_file_name or "",
        "rawVideoUrl": session.raw_video_url or "",
        "annotatedVideoUrl": session.annotated_video_url or "",
    }

    return {
        "sessionId": str(session.id),
        "dateLabel": _format_short_date(event),
        "timeLabel": _format_time(event),
        "session": session_payload,
        "analytics": _build_analytics_footer(data, metrics),
    }


def build_patient_time_history_dashboard(
    patient: Patient,
    sessions: list[Session],
    *,
    clinic_name: str = "Clinic",
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> dict[str, Any]:
    completed = [
        s for s in sessions if s.status == SessionStatus.COMPLETED and s.assessment
    ]
    completed.sort(key=lambda s: s.completed_at or s.created_at, reverse=True)

    if date_from:
        completed = [s for s in completed if (s.completed_at or s.created_at) >= date_from]
    if date_to:
        completed = [s for s in completed if (s.completed_at or s.created_at) <= date_to]

    assessments: list[tuple[Session, dict[str, Any]]] = [
        (s, s.assessment.summary_json) for s in completed if s.assessment
    ]

    if not assessments:
        return _empty_dashboard(patient, clinic_name)

    metrics_list = [data["metrics"] for _, data in assessments]
    avg_focus = sum(m["focusedDurationSeconds"] for m in metrics_list) / len(metrics_list)
    avg_drift = sum(m["attentionShifts"] for m in metrics_list) / len(metrics_list)
    avg_longest = sum(m["longestFocusDurationSeconds"] for m in metrics_list) / len(metrics_list)

    correct = sum(
        1
        for _, data in assessments
        if data["metrics"]["overallAttentionPercent"] >= 50
    )
    focused_pct = round((correct / len(assessments)) * 100)

    dates = [s.completed_at or s.created_at for s, _ in assessments]
    date_range = f"{_format_short_date(min(dates))} - {_format_short_date(max(dates))}"

    attention_over_time = []
    for session, data in reversed(list(assessments)):
        event = (
            session.completed_at
            or session.started_at
            or session.scheduled_at
            or session.created_at
        )
        attention_over_time.append(
            {
                "label": event.strftime("%b %d, %I:%M %p").lstrip("0").replace(" 0", " "),
                "focusTime": data["metrics"]["focusedDurationSeconds"],
                "attentionDrift": data["metrics"]["attentionShifts"],
            }
        )

    session_history = []
    for session, data in assessments[:8]:
        event = (
            session.completed_at
            or session.started_at
            or session.scheduled_at
            or session.created_at
        )
        attention_pct = data["metrics"]["overallAttentionPercent"]
        session_history.append(
            {
                "id": str(session.id),
                "displayId": session.display_id or "",
                "reportId": str(session.report.id) if session.report else None,
                "date": _format_short_date(event),
                "time": _format_time(event),
                "expectedWord": f"{attention_pct}%",
                "focusTime": f"{data['metrics']['focusedDurationSeconds']} sec",
                "drifts": data["metrics"]["attentionShifts"],
                "result": "correct" if attention_pct >= 50 else "incorrect",
                "resultLabel": "Focused" if attention_pct >= 50 else "Low attention",
            }
        )

    session_details = [
        _build_session_detail(session, data) for session, data in assessments
    ]
    latest_detail = session_details[0] if session_details else None

    return {
        "patient": {
            "id": str(patient.id),
            "displayId": patient.display_id or "",
            "name": f"{patient.first_name} {patient.last_name}",
            "age": _calculate_age(patient.dob),
            "gender": patient.gender,
        },
        "dateRangeLabel": date_range,
        "summaryMetrics": [
            {
                "id": "sessions",
                "label": "Total Sessions",
                "value": str(len(assessments)),
                "icon": "sessions",
                "tone": "blue",
            },
            {
                "id": "focus",
                "label": "Avg Focus Time",
                "value": f"{avg_focus:.1f} sec",
                "icon": "focus",
                "tone": "green",
            },
            {
                "id": "drift",
                "label": "Avg Attention Drift",
                "value": f"{avg_drift:.1f}",
                "icon": "drift",
                "tone": "orange",
            },
            {
                "id": "longest",
                "label": "Avg Longest Focus",
                "value": f"{avg_longest:.1f} sec",
                "icon": "longest",
                "tone": "purple",
            },
            {
                "id": "responses",
                "label": "Focused Sessions",
                "value": f"{focused_pct}%",
                "subtext": f"{correct}/{len(assessments)} above 50% attention",
                "icon": "responses",
                "tone": "rose",
            },
        ],
        "attentionOverTime": attention_over_time,
        "sessionHistory": session_history,
        "sessionDetails": session_details,
        "latestSession": latest_detail["session"] if latest_detail else _empty_session_payload(),
        "analyticsFooter": latest_detail["analytics"] if latest_detail else _empty_analytics_footer(),
    }


def _calculate_age(dob) -> int:
    from datetime import date

    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _empty_session_payload() -> dict[str, Any]:
    return {
        "sessionId": None,
        "sessionDisplayId": "",
        "reportId": None,
        "dateLabel": "—",
        "attentionStatus": "—",
        "ear": "—",
        "blink": "—",
        "yaw": "—",
        "pitch": "—",
        "totalTimeSeconds": 0,
        "focusDistribution": [],
        "focusTime": "—",
        "attentionDrifts": 0,
        "longestFocus": "—",
        "expectedWord": "—",
        "expectedWords": [],
        "detectedWord": "—",
        "confidence": 0,
        "responseTime": "—",
        "speechMatches": [],
        "speechOtherWords": [],
        "speechAvailable": False,
        "doctorNotes": "",
        "rawVideoFileName": "",
        "annotatedVideoFileName": "",
        "rawVideoUrl": "",
        "annotatedVideoUrl": "",
    }


def _empty_analytics_footer() -> dict[str, Any]:
    return {
        "gazeHeatmap": [],
        "gazeDistribution": [],
        "totalBlinks": 0,
        "blinkRate": "0/min",
        "headStabilityScore": 0,
        "headMovementLevel": "—",
        "headMovementTrend": [],
        "engagementScore": 0,
        "engagementLabel": "—",
    }


def _empty_dashboard(patient: Patient, clinic_name: str) -> dict[str, Any]:
    return {
        "patient": {
            "id": str(patient.id),
            "displayId": patient.display_id or "",
            "name": f"{patient.first_name} {patient.last_name}",
            "age": _calculate_age(patient.dob),
            "gender": patient.gender,
        },
        "dateRangeLabel": "No sessions yet",
        "summaryMetrics": [],
        "attentionOverTime": [],
        "sessionHistory": [],
        "sessionDetails": [],
        "latestSession": _empty_session_payload(),
        "analyticsFooter": _empty_analytics_footer(),
    }
