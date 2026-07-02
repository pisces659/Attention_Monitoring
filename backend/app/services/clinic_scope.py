"""Shared clinic scope helpers."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import AuthContext
from app.models import DoctorClinic, DoctorClinicStatus


async def get_doctor_clinic_ids(db: AsyncSession, auth: AuthContext) -> list[UUID]:
    if auth.clinic_id is None:
        return []

    clinic_ids = {auth.clinic_id}
    if auth.doctor:
        result = await db.execute(
            select(DoctorClinic.clinic_id).where(
                DoctorClinic.doctor_id == auth.doctor.id,
                DoctorClinic.status == DoctorClinicStatus.ACTIVE,
            )
        )
        clinic_ids.update(row[0] for row in result.all())

    return list(clinic_ids)
