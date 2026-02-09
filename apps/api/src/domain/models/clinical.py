"""VitalSign, Medication, MedicationAdmin, Alarm models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


class VitalSign(Base):
    __tablename__ = "vital_signs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    source: Mapped[str] = mapped_column(String(20), default="manual")  # manual, device, hl7
    heart_rate: Mapped[float | None] = mapped_column(Float)
    systolic_bp: Mapped[float | None] = mapped_column(Float)
    diastolic_bp: Mapped[float | None] = mapped_column(Float)
    spo2: Mapped[float | None] = mapped_column(Float)
    temperature: Mapped[float | None] = mapped_column(Float)
    respiratory_rate: Mapped[float | None] = mapped_column(Float)
    gcs: Mapped[int | None] = mapped_column(Integer)
    pain_score: Mapped[int | None] = mapped_column(Integer)
    extra: Mapped[dict | None] = mapped_column(JSONB)


class Encounter(Base):
    __tablename__ = "encounters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, finished, cancelled
    encounter_type: Mapped[str] = mapped_column(String(30))  # hospitalization, home-care, ambulatory
    ward: Mapped[str | None] = mapped_column(String(50))
    bed: Mapped[str | None] = mapped_column(String(20))
    admitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    discharged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str | None] = mapped_column(Text)
    attending_physician_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


class Alarm(Base):
    __tablename__ = "alarms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    vital_sign_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("vital_signs.id"))
    parameter: Mapped[str] = mapped_column(String(30))
    value: Mapped[float] = mapped_column(Float)
    threshold_min: Mapped[float | None] = mapped_column(Float)
    threshold_max: Mapped[float | None] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(20))  # info, warning, critical
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, acknowledged, resolved
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    acknowledged_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
