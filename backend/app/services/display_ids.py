"""Globally unique human-readable display identifiers (P0001, S0001, …)."""

from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Patient, Session

PATIENT_PREFIX = "P"
SESSION_PREFIX = "S"
DISPLAY_ID_PATTERN = re.compile(r"^([A-Z])(\d+)$")


def format_display_id(prefix: str, number: int) -> str:
    return f"{prefix}{number:04d}"


def _max_number_from_rows(prefix: str, values: list[str | None]) -> int:
    max_num = 0
    for value in values:
        if not value:
            continue
        match = DISPLAY_ID_PATTERN.match(value.strip().upper())
        if match and match.group(1) == prefix:
            max_num = max(max_num, int(match.group(2)))
    return max_num


async def allocate_patient_display_id(db: AsyncSession) -> str:
    result = await db.execute(select(Patient.display_id))
    next_num = _max_number_from_rows(PATIENT_PREFIX, list(result.scalars())) + 1
    return format_display_id(PATIENT_PREFIX, next_num)


async def allocate_session_display_id(db: AsyncSession) -> str:
    result = await db.execute(select(Session.display_id))
    next_num = _max_number_from_rows(SESSION_PREFIX, list(result.scalars())) + 1
    return format_display_id(SESSION_PREFIX, next_num)
