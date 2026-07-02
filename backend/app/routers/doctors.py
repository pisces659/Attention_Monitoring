"""Doctor endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AuthContext, require_doctor_clinic
from app.models import (
    Doctor,
    DoctorClinic,
    DoctorClinicRole,
    DoctorClinicStatus,
    User,
    UserRole,
)

router = APIRouter(prefix="/doctors", tags=["doctors"])


class DoctorCreate(BaseModel):
    full_name: str = Field(alias="fullName")
    email: str
    title: str = "Therapist"
    specialization: str = ""

    model_config = {"populate_by_name": True}


@router.get("")
async def list_doctors(
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(Doctor, User)
        .join(User, User.id == Doctor.user_id)
        .join(DoctorClinic, DoctorClinic.doctor_id == Doctor.id)
        .where(DoctorClinic.clinic_id == auth.clinic_id)
        .order_by(User.full_name)
    )
    rows = result.all()
    return [
        {
            "id": str(doctor.id),
            "name": user.full_name,
            "email": user.email,
            "title": doctor.title,
            "specialty": doctor.specialization or "",
            "avatarInitials": user.avatar_initials
            or f"{user.full_name[:1]}{user.full_name.split()[-1][:1]}".upper(),
        }
        for doctor, user in rows
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_doctor(
    payload: DoctorCreate,
    auth: AuthContext = Depends(require_doctor_clinic),
    db: AsyncSession = Depends(get_db),
) -> dict:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    initials = "".join(part[0] for part in payload.full_name.split()[:2]).upper()
    user = User(
        auth_user_id=uuid.uuid4(),
        email=payload.email,
        role=UserRole.DOCTOR,
        full_name=payload.full_name,
        avatar_initials=initials,
    )
    db.add(user)
    await db.flush()

    doctor = Doctor(
        user_id=user.id,
        specialization=payload.specialization or None,
        title=payload.title,
    )
    db.add(doctor)
    await db.flush()

    db.add(
        DoctorClinic(
            doctor_id=doctor.id,
            clinic_id=auth.clinic_id,
            role=DoctorClinicRole.MEMBER,
            is_primary=False,
            status=DoctorClinicStatus.ACTIVE,
        )
    )
    await db.commit()

    return {
        "id": str(doctor.id),
        "name": user.full_name,
        "email": user.email,
        "title": doctor.title,
        "specialty": doctor.specialization or "",
        "avatarInitials": initials,
    }
