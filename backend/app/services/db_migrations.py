"""Lightweight SQLite migrations for local development."""

from __future__ import annotations

import sqlalchemy as sa

from app.database import SessionLocal, engine
from app.models import Patient, Session
from app.services.display_ids import allocate_patient_display_id, allocate_session_display_id


async def run_dev_migrations() -> None:
    from app.config import get_settings

    settings = get_settings()
    is_sqlite = settings.database_url.startswith("sqlite")

    if is_sqlite:
        async with engine.begin() as conn:
            await conn.run_sync(_ensure_schema_updates)

    async with SessionLocal() as db:
        await _backfill_missing_display_ids(db)
        await db.commit()


def _ensure_schema_updates(connection: sa.Connection) -> None:
    from app.database import Base
    from app.models import StimulusVideo

    inspector = sa.inspect(connection)
    tables = set(inspector.get_table_names())
    if "stimulus_videos" not in tables:
        StimulusVideo.__table__.create(connection)

    if "sessions" in tables:
        columns = {column["name"] for column in inspector.get_columns("sessions")}
        if "display_id" not in columns:
            connection.execute(sa.text("ALTER TABLE sessions ADD COLUMN display_id TEXT"))
        if "stimulus_video_id" not in columns:
            connection.execute(
                sa.text("ALTER TABLE sessions ADD COLUMN stimulus_video_id TEXT")
            )


async def _backfill_missing_display_ids(db) -> None:
    patients = (
        await db.execute(
            sa.select(Patient).where(Patient.display_id.is_(None)).order_by(Patient.created_at)
        )
    ).scalars().all()
    for patient in patients:
        patient.display_id = await allocate_patient_display_id(db)
        await db.flush()

    sessions = (
        await db.execute(
            sa.select(Session).where(Session.display_id.is_(None)).order_by(Session.created_at)
        )
    ).scalars().all()
    for session in sessions:
        session.display_id = await allocate_session_display_id(db)
        await db.flush()
