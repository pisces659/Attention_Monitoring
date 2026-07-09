"""Delete a patient and cascaded rows by name. Usage: python -m scripts.delete_patient Santhosh Ram"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.database import SessionLocal
from app.models import Assessment, ParentChild, Patient, PatientClinic, Report, Session


async def delete_patient_by_name(first_name: str, last_name: str) -> None:
    async with SessionLocal() as db:
        result = await db.execute(
            select(Patient)
            .where(Patient.first_name == first_name, Patient.last_name == last_name)
            .options(selectinload(Patient.sessions).selectinload(Session.assessment))
        )
        patient = result.scalar_one_or_none()
        if not patient:
            print(f"Patient not found: {first_name} {last_name}")
            return

        print(f"Deleting {patient.first_name} {patient.last_name} ({patient.display_id})")

        session_ids = [session.id for session in patient.sessions]
        if session_ids:
            await db.execute(delete(Report).where(Report.session_id.in_(session_ids)))
            await db.execute(delete(Assessment).where(Assessment.session_id.in_(session_ids)))
            await db.execute(delete(Session).where(Session.patient_id == patient.id))

        await db.execute(delete(PatientClinic).where(PatientClinic.patient_id == patient.id))
        await db.execute(delete(ParentChild).where(ParentChild.patient_id == patient.id))
        await db.execute(delete(Patient).where(Patient.id == patient.id))
        await db.commit()
        print("Deleted.")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("Usage: python -m scripts.delete_patient <first_name> <last_name>")
    asyncio.run(delete_patient_by_name(sys.argv[1], sys.argv[2]))
