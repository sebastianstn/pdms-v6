"""Home-Spital-specific models — Phase 3b.

HomeVisit:      Hausbesuch mit Status-Tracking (geplant → unterwegs → vor Ort → durchgeführt).
Teleconsult:    Telemedizin-Sitzung mit SOAP-Template und Dauer-Tracking.
RemoteDevice:   Remote-Monitoring-Geräte (5 Typen) mit Online-Status.
SelfMedicationLog: Selbstmedikations-Bestätigung (Patient-App-Konzept).
"""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


# ─── Hausbesuche (3b.1) ───────────────────────────────────────


class HomeVisit(Base):
    """Hausbesuch — erweitert einen Appointment vom Typ 'hausbesuch'.

    Status-Flow: planned → en_route → arrived → in_progress → completed | cancelled.
    """

    __tablename__ = "home_visits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("appointments.id"))
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    # Zuordnung
    assigned_nurse_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    assigned_nurse_name: Mapped[str | None] = mapped_column(String(200))

    # Status
    status: Mapped[str] = mapped_column(String(20), default="planned")
    # planned, en_route, arrived, in_progress, completed, cancelled

    # Zeiten
    planned_date: Mapped[date] = mapped_column(Date, index=True)
    planned_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    planned_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_arrival: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_departure: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    travel_time_minutes: Mapped[int | None] = mapped_column(Integer)
    visit_duration_minutes: Mapped[int | None] = mapped_column(Integer)

    # Durchgeführte Leistungen
    vital_signs_recorded: Mapped[bool] = mapped_column(Boolean, default=False)
    medication_administered: Mapped[bool] = mapped_column(Boolean, default=False)
    wound_care_performed: Mapped[bool] = mapped_column(Boolean, default=False)
    iv_therapy_performed: Mapped[bool] = mapped_column(Boolean, default=False)
    blood_drawn: Mapped[bool] = mapped_column(Boolean, default=False)

    # Patientenzustand bei Besuch
    patient_condition: Mapped[str | None] = mapped_column(String(20))
    # stable, improved, deteriorated, critical

    documentation: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── Teleconsult (3b.3) ───────────────────────────────────────


class Teleconsult(Base):
    """Telemedizin-Sitzung mit Video-Link, Dauer-Tracking und SOAP-Template."""

    __tablename__ = "teleconsults"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("appointments.id"))
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    # Arzt
    physician_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    physician_name: Mapped[str | None] = mapped_column(String(200))

    # Status: scheduled, waiting, active, completed, no_show, technical_issue
    status: Mapped[str] = mapped_column(String(20), default="scheduled")

    # Meeting
    meeting_link: Mapped[str | None] = mapped_column(String(500))
    meeting_platform: Mapped[str | None] = mapped_column(String(50))  # zoom, teams, hin_talk

    # Zeiten
    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scheduled_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[int | None] = mapped_column(Integer)

    # SOAP-Template
    soap_subjective: Mapped[str | None] = mapped_column(Text)
    soap_objective: Mapped[str | None] = mapped_column(Text)
    soap_assessment: Mapped[str | None] = mapped_column(Text)
    soap_plan: Mapped[str | None] = mapped_column(Text)

    # Qualität & Followup
    technical_quality: Mapped[str | None] = mapped_column(String(10))  # good, fair, poor
    followup_required: Mapped[bool] = mapped_column(Boolean, default=False)
    followup_notes: Mapped[str | None] = mapped_column(Text)

    # Verknüpfung zur klinischen Notiz
    clinical_note_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── Remote-Geräte (3b.4) ─────────────────────────────────────


class RemoteDevice(Base):
    """Remote-Monitoring-Gerät — Pulsoximeter, Blutdruck, Waage, Thermometer, Glukometer."""

    __tablename__ = "remote_devices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)

    # Gerätetyp
    device_type: Mapped[str] = mapped_column(String(30))
    # pulsoximeter, blood_pressure, scale, thermometer, glucometer

    device_name: Mapped[str] = mapped_column(String(200))
    serial_number: Mapped[str | None] = mapped_column(String(100))
    manufacturer: Mapped[str | None] = mapped_column(String(200))

    # Online-Status
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    battery_level: Mapped[int | None] = mapped_column(Integer)  # 0-100

    # Letzter Messwert
    last_reading_value: Mapped[str | None] = mapped_column(String(50))  # z.B. "98", "120/80"
    last_reading_unit: Mapped[str | None] = mapped_column(String(20))  # z.B. "%", "mmHg", "kg"
    last_reading_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Schwellenwerte für Alarme
    alert_threshold_low: Mapped[str | None] = mapped_column(String(50))
    alert_threshold_high: Mapped[str | None] = mapped_column(String(50))

    installed_at: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── Selbstmedikation (3b.6 — Konzept) ────────────────────────


class SelfMedicationLog(Base):
    """Patient-Selbstmedikations-Bestätigung.

    Konzept für Patient-App: Patient bestätigt Medikamenten-Einnahme.
    Status: pending → confirmed | missed | skipped.
    """

    __tablename__ = "self_medication_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    medication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("medications.id"), index=True)

    scheduled_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # pending, confirmed, missed, skipped
    status: Mapped[str] = mapped_column(String(20), default="pending")

    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
