"""Dashboard endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import AuthContext, require_doctor_clinic
from app.models import Clinic, Patient, PatientClinic, PatientClinicStatus, Session
from app.services.clinic_scope import get_doctor_clinic_ids
from app.services.dashboard_service import build_patient_time_history_dashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/patient-time-history")
async def patient_time_history(
    patient_id: UUID = Query(..., alias="patientId"),
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    clinic_ids = await get_doctor_clinic_ids(db, auth)
    result = await db.execute(
        select(Patient)
        .join(PatientClinic)
        .where(Patient.id == patient_id, PatientClinic.clinic_id.in_(clinic_ids))
        .options(
            selectinload(Patient.sessions).selectinload(Session.assessment),
            selectinload(Patient.sessions).selectinload(Session.report),
        )
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    clinic_result = await db.execute(select(Clinic).where(Clinic.id == auth.clinic_id))
    clinic = clinic_result.scalar_one_or_none()
    clinic_name = clinic.name if clinic else "Clinic"

    return build_patient_time_history_dashboard(
        patient,
        patient.sessions,
        clinic_name=clinic_name,
    )


@router.get("/sidebar-patients")
async def sidebar_patients(
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    clinic_ids = await get_doctor_clinic_ids(db, auth)
    result = await db.execute(
        select(Patient, Clinic.name)
        .select_from(Patient)
        .join(PatientClinic, PatientClinic.patient_id == Patient.id)
        .join(Clinic, Clinic.id == PatientClinic.clinic_id)
        .where(
            PatientClinic.clinic_id.in_(clinic_ids),
            PatientClinic.status == PatientClinicStatus.ACTIVE,
        )
        .order_by(Clinic.name, Patient.first_name)
    )
    rows = result.all()
    return [
        {
            "id": str(patient.id),
            "displayId": patient.display_id or "",
            "name": f"{patient.first_name} {patient.last_name}",
            "clinic": clinic_name,
            "avatarInitials": f"{patient.first_name[0]}{patient.last_name[0]}".upper(),
        }
        for index, (patient, clinic_name) in enumerate(rows)
    ]
