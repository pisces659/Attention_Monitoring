"""Patient endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import AuthContext, require_doctor_clinic
from app.database import get_db
from app.models import Doctor, Patient, PatientClinic, PatientClinicStatus, Session, SessionStatus
from app.serializers import patient_to_json
from app.services.clinic_scope import get_doctor_clinic_ids
from app.services.display_ids import allocate_patient_display_id

router = APIRouter(prefix="/patients", tags=["patients"])


class PatientCreate(BaseModel):
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    dob: str
    gender: str
    diagnosis: str = ""
    notes: str = ""

    model_config = {"populate_by_name": True}


@router.get("")
async def list_patients(
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    clinic_ids = await get_doctor_clinic_ids(db, auth)
    result = await db.execute(
        select(Patient)
        .join(PatientClinic)
        .where(
            PatientClinic.clinic_id.in_(clinic_ids),
            PatientClinic.status == PatientClinicStatus.ACTIVE,
        )
        .options(
            selectinload(Patient.sessions).selectinload(Session.assessment),
        )
    )
    patients = result.scalars().unique().all()

    doctor_name = auth.user.full_name
    output = []
    for patient in patients:
        completed = [s for s in patient.sessions if s.status == SessionStatus.COMPLETED]
        last_session = max(
            (
                s.completed_at or s.started_at or s.scheduled_at or s.created_at
                for s in patient.sessions
            ),
            default=patient.created_at,
        )
        attention_scores = []
        for session in completed:
            if session.assessment:
                attention_scores.append(session.assessment.summary_json["metrics"]["overallAttentionPercent"])
        avg_attention = sum(attention_scores) / len(attention_scores) if attention_scores else 0
        speech_scores = []
        for session in completed:
            if session.assessment:
                speech = session.assessment.summary_json.get("speechMetrics", {})
                if speech.get("available") and speech.get("speechScore") is not None:
                    speech_scores.append(speech["speechScore"])
        avg_speech = sum(speech_scores) / len(speech_scores) if speech_scores else 0

        output.append(
            patient_to_json(
                patient,
                doctor_name=doctor_name,
                session_count=len(completed),
                last_session=last_session,
                average_attention=avg_attention,
                average_speech=avg_speech,
            )
        )
    return output


@router.get("/{patient_id}")
async def get_patient(
    patient_id: UUID,
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    patient = await _get_clinic_patient(db, patient_id, auth)
    completed = [s for s in patient.sessions if s.status.value == "completed"]
    last_session = max(
        (
            s.completed_at or s.started_at or s.scheduled_at or s.created_at
            for s in patient.sessions
        ),
        default=patient.created_at,
    )
    attention_scores = [
        s.assessment.summary_json["metrics"]["overallAttentionPercent"]
        for s in completed
        if s.assessment
    ]
    speech_scores = [
        s.assessment.summary_json["speechMetrics"]["speechScore"]
        for s in completed
        if s.assessment
        and s.assessment.summary_json.get("speechMetrics", {}).get("available")
        and s.assessment.summary_json["speechMetrics"].get("speechScore") is not None
    ]
    return patient_to_json(
        patient,
        doctor_name=auth.user.full_name,
        session_count=len(completed),
        last_session=last_session,
        average_attention=sum(attention_scores) / len(attention_scores) if attention_scores else 0,
        average_speech=sum(speech_scores) / len(speech_scores) if speech_scores else 0,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from datetime import date

    patient = Patient(
        first_name=payload.first_name,
        last_name=payload.last_name,
        dob=date.fromisoformat(payload.dob),
        gender=payload.gender,
        diagnosis=payload.diagnosis,
        notes=payload.notes,
        display_id=await allocate_patient_display_id(db),
    )
    db.add(patient)
    await db.flush()
    db.add(
        PatientClinic(
            patient_id=patient.id,
            clinic_id=auth.clinic_id,
            status=PatientClinicStatus.ACTIVE,
        )
    )
    await db.commit()
    await db.refresh(patient)
    return patient_to_json(patient, doctor_name=auth.user.full_name)


async def _get_clinic_patient(
    db: AsyncSession, patient_id: UUID, auth: AuthContext
) -> Patient:
    clinic_ids = await get_doctor_clinic_ids(db, auth)
    result = await db.execute(
        select(Patient)
        .join(PatientClinic)
        .where(
            Patient.id == patient_id,
            PatientClinic.clinic_id.in_(clinic_ids),
        )
        .options(selectinload(Patient.sessions).selectinload(Session.assessment))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient
