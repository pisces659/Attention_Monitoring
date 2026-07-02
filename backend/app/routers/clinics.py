"""Clinic endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AuthContext, get_auth_context, require_doctor_clinic
from app.models import (
    Clinic,
    DoctorClinic,
    DoctorClinicRole,
    DoctorClinicStatus,
    UserClinicContext,
)

router = APIRouter(prefix="/clinics", tags=["clinics"])


class ClinicCreate(BaseModel):
    name: str
    address: str = ""
    phone: str = ""
    timezone: str = "UTC"


def _clinic_to_json(clinic: Clinic) -> dict:
    return {
        "id": str(clinic.id),
        "name": clinic.name,
        "address": clinic.address or "",
        "phone": clinic.phone or "",
        "timezone": clinic.timezone,
    }


@router.get("/current")
async def get_current_clinic(
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Clinic).where(Clinic.id == auth.clinic_id))
    clinic = result.scalar_one_or_none()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return _clinic_to_json(clinic)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_clinic(
    payload: ClinicCreate,
    auth: AuthContext = Depends(get_auth_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if auth.doctor is None:
        raise HTTPException(status_code=400, detail="Doctor profile required")

    clinic = Clinic(
        name=payload.name,
        address=payload.address or None,
        phone=payload.phone or None,
        timezone=payload.timezone,
    )
    db.add(clinic)
    await db.flush()

    db.add(
        DoctorClinic(
            doctor_id=auth.doctor.id,
            clinic_id=clinic.id,
            role=DoctorClinicRole.OWNER,
            is_primary=True,
            status=DoctorClinicStatus.ACTIVE,
        )
    )

    result = await db.execute(
        select(UserClinicContext).where(UserClinicContext.user_id == auth.user.id)
    )
    context = result.scalar_one_or_none()
    if context:
        context.clinic_id = clinic.id
    else:
        db.add(UserClinicContext(user_id=auth.user.id, clinic_id=clinic.id))

    await db.commit()
    await db.refresh(clinic)
    return _clinic_to_json(clinic)
