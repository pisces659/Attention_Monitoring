"""Authentication endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import AuthContext, get_auth_context, get_current_user
from app.models import Doctor, User, UserClinicContext

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_me(auth: AuthContext = Depends(get_auth_context)) -> dict:
    user = auth.user
    clinician = {
        "id": str(user.id),
        "name": user.full_name,
        "title": auth.doctor.title if auth.doctor else user.role.value.replace("_", " ").title(),
        "specialty": auth.doctor.specialization if auth.doctor else "",
        "avatarInitials": user.avatar_initials or user.full_name[:2].upper(),
        "email": user.email,
    }
    return {
        "user": {"email": user.email, "name": user.full_name, "role": user.role.value},
        "clinician": clinician,
        "clinicId": str(auth.clinic_id) if auth.clinic_id else None,
    }


@router.post("/select-clinic/{clinic_id}")
async def select_clinic(
    clinic_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(UserClinicContext).where(UserClinicContext.user_id == user.id)
    )
    context = result.scalar_one_or_none()
    if context:
        from uuid import UUID

        context.clinic_id = UUID(clinic_id)
    else:
        from uuid import UUID

        db.add(UserClinicContext(user_id=user.id, clinic_id=UUID(clinic_id)))
    await db.commit()
    return {"clinicId": clinic_id}
