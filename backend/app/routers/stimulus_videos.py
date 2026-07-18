"""Stimulus video library API."""

from __future__ import annotations

import json
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AuthContext, require_doctor_clinic
from app.models import StimulusVideo
from app.services.stimulus_analysis_service import analyze_stimulus_video
from app.services.storage_service import StorageService, _video_content_type

router = APIRouter(prefix="/stimulus-videos", tags=["stimulus-videos"])

BUILTIN_DEFAULT = {
    "id": "builtin-identification",
    "title": "Basic Identification (Built-in)",
    "description": "Red circle, blue square, elephant, green triangle, yellow star.",
    "videoUrl": "",
    "keywords": ["red", "square", "elephant", "green", "star"],
    "focusAreas": [
        {
            "id": "red-circle",
            "label": "Red circle",
            "startMs": 0,
            "endMs": 5000,
            "keywords": ["red"],
            "prompt": "What color is this?",
        },
        {
            "id": "blue-square",
            "label": "Blue square",
            "startMs": 5000,
            "endMs": 10000,
            "keywords": ["square"],
            "prompt": "What shape is this?",
        },
        {
            "id": "elephant",
            "label": "Elephant",
            "startMs": 10000,
            "endMs": 15000,
            "keywords": ["elephant"],
            "prompt": "What animal is this?",
        },
        {
            "id": "green-triangle",
            "label": "Green triangle",
            "startMs": 15000,
            "endMs": 20000,
            "keywords": ["green"],
            "prompt": "What color is this shape?",
        },
        {
            "id": "yellow-star",
            "label": "Yellow star",
            "startMs": 20000,
            "endMs": 25000,
            "keywords": ["star"],
            "prompt": "How many points does this star have?",
        },
    ],
    "durationMs": 25000,
    "isDefault": True,
    "isBuiltin": True,
    "analysisStatus": "completed",
}


def _to_json(video: StimulusVideo) -> dict:
    focus_areas = video.focus_areas or []
    return {
        "id": str(video.id),
        "title": video.title,
        "description": video.description or "",
        "videoUrl": video.video_url,
        "keywords": video.keywords or [],
        "focusAreas": focus_areas,
        "durationMs": video.duration_ms,
        "isDefault": video.is_default,
        "isBuiltin": False,
        "analysisStatus": "completed" if focus_areas else "pending",
    }


@router.get("")
async def list_stimulus_videos(
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(StimulusVideo)
        .where(
            StimulusVideo.is_active.is_(True),
            or_(
                StimulusVideo.clinic_id.is_(None),
                StimulusVideo.clinic_id == auth.clinic_id,
            ),
        )
        .order_by(StimulusVideo.is_default.desc(), StimulusVideo.created_at.desc())
    )
    items = [_to_json(video) for video in result.scalars().all()]
    if not any(item.get("isDefault") for item in items):
        return [BUILTIN_DEFAULT, *items]
    return items


@router.get("/{video_id}")
async def get_stimulus_video(
    video_id: str,
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if video_id == BUILTIN_DEFAULT["id"]:
        return BUILTIN_DEFAULT

    try:
        parsed_id = UUID(video_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Stimulus video not found.") from exc

    video = await db.get(StimulusVideo, parsed_id)
    if not video or not video.is_active:
        raise HTTPException(status_code=404, detail="Stimulus video not found.")
    if video.clinic_id and video.clinic_id != auth.clinic_id:
        raise HTTPException(status_code=404, detail="Stimulus video not found.")
    return _to_json(video)


@router.post("")
async def create_stimulus_video(
    title: str = Form(...),
    description: str = Form(default=""),
    keywords: str = Form(default=""),
    focus_areas_json: str = Form(default="[]"),
    duration_ms: int = Form(default=0),
    video: UploadFile = File(...),
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    video_bytes = await video.read()
    if not video_bytes:
        raise HTTPException(status_code=400, detail="Video file is required.")

    keyword_list = [word.strip() for word in keywords.split(",") if word.strip()]
    focus_areas_override: list[dict] | None = None
    if focus_areas_json and focus_areas_json.strip() not in ("", "[]"):
        try:
            parsed = json.loads(focus_areas_json)
            if isinstance(parsed, list) and parsed:
                focus_areas_override = parsed
        except json.JSONDecodeError:
            focus_areas_override = None

    filename = video.filename or "stimulus.mp4"
    analysis_status = "manual" if focus_areas_override else "pending"
    resolved_duration_ms = duration_ms or 0
    focus_areas = focus_areas_override or []

    if not focus_areas:
        analysis = analyze_stimulus_video(
            video_bytes,
            filename,
            keyword_list or None,
        )
        focus_areas = analysis.get("focusAreas") or []
        keyword_list = analysis.get("keywords") or keyword_list
        resolved_duration_ms = analysis.get("durationMs") or resolved_duration_ms
        analysis_status = "completed" if focus_areas else "failed"

    storage = StorageService()
    video_url = await storage.upload_bytes(
        "stimulus-videos",
        f"{auth.clinic_id}/{filename}",
        video_bytes,
        _video_content_type(filename),
    )

    record = StimulusVideo(
        clinic_id=auth.clinic_id,
        title=title.strip(),
        description=description.strip() or None,
        video_url=video_url,
        keywords=keyword_list,
        focus_areas=focus_areas,
        duration_ms=resolved_duration_ms or None,
        is_default=False,
        is_active=True,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    payload = _to_json(record)
    payload["analysisStatus"] = analysis_status
    return payload


@router.delete("/{video_id}")
async def delete_stimulus_video(
    video_id: UUID,
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    video = await db.get(StimulusVideo, video_id)
    if not video or video.clinic_id != auth.clinic_id:
        raise HTTPException(status_code=404, detail="Stimulus video not found.")
    video.is_active = False
    await db.commit()
    return {"status": "deleted"}
