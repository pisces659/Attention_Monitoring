"""Authentication helpers — Supabase JWT validation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models import Doctor, User, UserRole

security = HTTPBearer(auto_error=False)
settings = get_settings()


@dataclass
class AuthContext:
    user: User
    doctor: Optional[Doctor]
    clinic_id: Optional[UUID]


def _decode_token(token: str) -> dict:
    settings = get_settings()

    if settings.dev_auth_bypass and token == "dev-token":
        return {"sub": "dev-auth-user", "email": "demo@neurolens.ai"}

    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication not configured",
        )

    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    settings = get_settings()

    if credentials is None:
        if settings.dev_auth_bypass:
            result = await db.execute(
                select(User)
                .options(selectinload(User.doctor))
                .where(User.email == "demo@neurolens.ai")
            )
            user = result.scalar_one_or_none()
            if user:
                return user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = _decode_token(credentials.credentials)
    auth_user_id = payload.get("sub")
    email = payload.get("email")

    if not auth_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if settings.dev_auth_bypass and auth_user_id == "dev-auth-user":
        result = await db.execute(
            select(User).options(selectinload(User.doctor)).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        if user:
            return user

    result = await db.execute(
        select(User).options(selectinload(User.doctor)).where(User.auth_user_id == auth_user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User profile not found")
    return user


async def get_auth_context(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AuthContext:
    from app.models import UserClinicContext

    clinic_id: Optional[UUID] = None
    result = await db.execute(
        select(UserClinicContext).where(UserClinicContext.user_id == user.id)
    )
    context = result.scalar_one_or_none()
    if context:
        clinic_id = context.clinic_id

    return AuthContext(user=user, doctor=user.doctor, clinic_id=clinic_id)


async def require_doctor_clinic(
    auth: AuthContext = Depends(get_auth_context),
) -> AuthContext:
    if auth.user.role not in (UserRole.DOCTOR, UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")
    if auth.clinic_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Clinic not selected")
    if auth.doctor is None and auth.user.role == UserRole.DOCTOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor profile required")
    return auth
