"""Build Patient Time History dashboard JSON from DB data."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from app.models import Assessment, Patient, Session, SessionStatus


def _format_short_date(value: datetime) -> str:
    return value.strftime("%d %b %Y")


def _format_time(value: datetime) -> str:
    return value.strftime("%I:%M %p").lstrip("0")


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
                "label": event.strftime("%b %d"),
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

    latest_session_obj, latest_data = assessments[0]
    latest_metrics = latest_data["metrics"]
    latest_frame = latest_data.get("latestFrame", {})
    latest_speech = latest_data.get("speechMetrics", {})
    speech_available = bool(latest_speech.get("available"))

    detailed_focus = latest_data.get("detailedFocusDistribution") or latest_data.get(
        "focusDistribution", []
    )
    if detailed_focus and detailed_focus[0].get("value", 0) > 100:
        total = sum(item["value"] for item in detailed_focus) or 1
        detailed_focus = [
            {**item, "value": round((item["value"] / total) * 100)} for item in detailed_focus
        ]

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
        "latestSession": {
            "sessionId": str(latest_session_obj.id),
            "sessionDisplayId": latest_session_obj.display_id or "",
            "reportId": str(latest_session_obj.report.id)
            if latest_session_obj.report
            else None,
            "dateLabel": _format_short_date(
                latest_session_obj.completed_at
                or latest_session_obj.started_at
                or latest_session_obj.scheduled_at
                or latest_session_obj.created_at
            ),
            "attentionStatus": latest_frame.get("attentionState", "Unknown"),
            "ear": str(latest_frame.get("ear", 0)),
            "blink": "Yes" if latest_frame.get("blink") else "No",
            "yaw": f"{latest_frame.get('yaw', 0)}°",
            "pitch": f"{latest_frame.get('pitch', 0)}°",
            "totalTimeSeconds": latest_data.get("durationSeconds", 0),
            "focusDistribution": detailed_focus,
            "focusTime": f"{latest_metrics['focusedDurationSeconds']} sec",
            "attentionDrifts": latest_metrics["attentionShifts"],
            "longestFocus": f"{latest_metrics['longestFocusDurationSeconds']} sec",
            "expectedWord": latest_speech.get("expectedWord") or ("N/A" if not speech_available else "—"),
            "detectedWord": latest_speech.get("detectedWord") or ("N/A" if not speech_available else "—"),
            "confidence": latest_speech.get("confidence") if speech_available else None,
            "responseTime": latest_speech.get("responseTime") or ("N/A" if not speech_available else "—"),
            "speechAvailable": speech_available,
            "doctorNotes": latest_session_obj.doctor_notes or "",
            "rawVideoFileName": latest_session_obj.video_file_name or "",
            "annotatedVideoFileName": latest_session_obj.processed_video_file_name or "",
            "rawVideoUrl": latest_session_obj.raw_video_url or "",
            "annotatedVideoUrl": latest_session_obj.annotated_video_url or "",
        },
        "analyticsFooter": {
            "gazeHeatmap": latest_data.get("gazeHeatmapMatrix", []),
            "gazeDistribution": latest_data.get("gazeDistribution", []),
            "totalBlinks": latest_metrics["blinkCount"],
            "blinkRate": f"{latest_metrics['averageBlinkRate']}/min",
            "headStabilityScore": latest_data.get("headStabilityScore", 0),
            "headMovementLevel": "Low"
            if latest_data.get("headStabilityScore", 0) >= 85
            else "Moderate",
            "headMovementTrend": latest_data.get("headPoseTimeline", []),
            "engagementScore": latest_data.get("engagementScore", 0),
            "engagementLabel": latest_data.get("engagementLabel", "Moderate"),
        },
    }


def _calculate_age(dob) -> int:
    from datetime import date

    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


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
        "latestSession": {
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
            "detectedWord": "—",
            "confidence": 0,
            "responseTime": "—",
            "doctorNotes": "",
            "rawVideoFileName": "",
            "annotatedVideoFileName": "",
            "rawVideoUrl": "",
            "annotatedVideoUrl": "",
        },
        "analyticsFooter": {
            "gazeHeatmap": [],
            "gazeDistribution": [],
            "totalBlinks": 0,
            "blinkRate": "0/min",
            "headStabilityScore": 0,
            "headMovementLevel": "—",
            "headMovementTrend": [],
            "engagementScore": 0,
            "engagementLabel": "—",
        },
    }
