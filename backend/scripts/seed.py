"""Seed MVP data: 1 clinic, 1 doctor, 1 parent, 1 child, 1 completed session."""

from __future__ import annotations

import asyncio
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal, engine, Base
from app.models import (
    Assessment,
    Clinic,
    Doctor,
    DoctorClinic,
    DoctorClinicRole,
    DoctorClinicStatus,
    ParentChild,
    Patient,
    PatientClinic,
    PatientClinicStatus,
    Report,
    Session,
    SessionStatus,
    User,
    UserClinicContext,
    UserRole,
)
from app.services.csv_parser import parse_csv_to_assessment


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    csv_path = (
        Path(__file__).resolve().parents[2]
        / "attention-web1"
        / "sample-data"
        / "sample-session.csv"
    )
    csv_text = csv_path.read_text(encoding="utf-8")
    assessment_json = parse_csv_to_assessment(csv_text)

    async with SessionLocal() as db:
        existing = await db.execute(select(Clinic).limit(1))
        if existing.scalar_one_or_none():
            print("Database already seeded.")
            return

        clinic_id = uuid.uuid4()
        doctor_user_id = uuid.uuid4()
        parent_user_id = uuid.uuid4()
        doctor_id = uuid.uuid4()
        patient_id = uuid.uuid4()
        session_id = uuid.uuid4()
        report_id = uuid.uuid4()
        assessment_id = uuid.uuid4()

        clinic = Clinic(
            id=clinic_id,
            name="NeuroLens Cognitive Clinic",
            address="123 Therapy Lane, Mumbai",
            phone="+91 98765 43210",
            timezone="Asia/Kolkata",
        )
        doctor_user = User(
            id=doctor_user_id,
            auth_user_id=uuid.uuid4(),
            email="demo@neurolens.ai",
            role=UserRole.DOCTOR,
            full_name="Dr. Ananya Sharma",
            avatar_initials="AS",
        )
        parent_user = User(
            id=parent_user_id,
            auth_user_id=uuid.uuid4(),
            email="parent@example.com",
            role=UserRole.PARENT,
            full_name="Priya Singh",
            avatar_initials="PS",
        )
        doctor = Doctor(
            id=doctor_id,
            user_id=doctor_user_id,
            specialization="Pediatric Cognitive Therapy",
            license_number="MH-PSY-12345",
            title="Therapist",
        )
        patient = Patient(
            id=patient_id,
            first_name="Riya",
            last_name="Singh",
            dob=date(2019, 3, 15),
            gender="Female",
            diagnosis="ADHD — Combined Type",
            notes="Responds well to structured visual cues.",
            display_id="P0001",
        )

        db.add_all([clinic, doctor_user, parent_user, doctor, patient])
        await db.flush()

        db.add_all(
            [
                DoctorClinic(
                    doctor_id=doctor_id,
                    clinic_id=clinic_id,
                    role=DoctorClinicRole.OWNER,
                    is_primary=True,
                    status=DoctorClinicStatus.ACTIVE,
                ),
                PatientClinic(
                    patient_id=patient_id,
                    clinic_id=clinic_id,
                    status=PatientClinicStatus.ACTIVE,
                ),
                ParentChild(parent_user_id=parent_user_id, patient_id=patient_id),
                UserClinicContext(user_id=doctor_user_id, clinic_id=clinic_id),
            ]
        )

        now = datetime.now(timezone.utc)
        session = Session(
            id=session_id,
            display_id="S0001",
            patient_id=patient_id,
            doctor_id=doctor_id,
            clinic_id=clinic_id,
            status=SessionStatus.COMPLETED,
            csv_url="seed/sample-session.csv",
            doctor_notes="Sample session from Sitting1 video analysis.",
            video_file_name="WhatsApp Video 2026-07-01.mp4",
            processed_video_file_name="annotated.mp4",
            started_at=now,
            completed_at=now,
        )
        assessment = Assessment(
            id=assessment_id,
            session_id=session_id,
            summary_json=assessment_json,
        )
        metrics = assessment_json["metrics"]
        report = Report(
            id=report_id,
            session_id=session_id,
            patient_id=patient_id,
            title="Session Report — Riya Singh",
            summary=(
                f"Attention score {metrics['overallAttentionPercent']}%. "
                f"Focused for {metrics['focusedDurationSeconds']}s."
            ),
            recommendations=[
                "Continue structured visual attention exercises.",
                "Monitor upward gaze drift during initial session minutes.",
            ],
        )

        db.add_all([session, assessment, report])
        await db.commit()
        print("Seed complete.")
        print(f"  Clinic ID:  {clinic_id}")
        print(f"  Doctor:     demo@neurolens.ai (dev-token auth)")
        print(f"  Patient ID: {patient_id}")
        print(f"  Session ID: {session_id}")


if __name__ == "__main__":
    asyncio.run(seed())
