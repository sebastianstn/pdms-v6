"""Appointment model — Phase 3a.1 Termin-Kalender.

Terminarten: Hausbesuch, Teleconsult, Konsil, Ambulant, Labor, Entlassung.
Wiederkehrende Termine über recurrence_rule (daily / weekly / biweekly).
Status-Flow: planned → confirmed → in_progress → completed | cancelled | no_show.
"""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    # Terminart
    appointment_type: Mapped[str] = mapped_column(String(30))
    # hausbesuch, teleconsult, konsil, ambulant, labor, entlassung, spitex, physiotherapie

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(255))  # Ort / Link

    # Zeitraum
    scheduled_date: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)

    # Zuordnung
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))  # Pflegeperson / Arzt
    assigned_name: Mapped[str | None] = mapped_column(String(200))  # Anzeigename

    # Status
    status: Mapped[str] = mapped_column(String(20), default="planned")
    # planned, confirmed, in_progress, completed, cancelled, no_show

    # Wiederholung
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_rule: Mapped[str | None] = mapped_column(String(30))  # daily, weekly, biweekly, monthly
    recurrence_end: Mapped[date | None] = mapped_column(Date)
    parent_appointment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("appointments.id"))

    # Transport (für ambulante Termine)
    transport_required: Mapped[bool] = mapped_column(Boolean, default=False)
    transport_type: Mapped[str | None] = mapped_column(String(30))  # selbst, taxi, ambulanz, angehoerige
    transport_notes: Mapped[str | None] = mapped_column(Text)

    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


class DischargeCriteria(Base):
    """Entlass-Kriterien-Checkliste (Phase 3a.3).

    6 Kern-Kriterien für i.v.-Antibiotika-Patienten:
    1. CRP fallend (Trend)
    2. CRP < 50 mg/L
    3. Afebril seit 48h
    4. 48h orale Antibiotika stabil
    5. Klinische Besserung
    6. Nachsorge organisiert
    """
    __tablename__ = "discharge_criteria"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), unique=True, index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    planned_discharge_date: Mapped[date | None] = mapped_column(Date)
    actual_discharge_date: Mapped[date | None] = mapped_column(Date)

    # 6 Kriterien (Boolean)
    crp_declining: Mapped[bool] = mapped_column(Boolean, default=False)
    crp_below_50: Mapped[bool] = mapped_column(Boolean, default=False)
    afebrile_48h: Mapped[bool] = mapped_column(Boolean, default=False)
    oral_stable_48h: Mapped[bool] = mapped_column(Boolean, default=False)
    clinical_improvement: Mapped[bool] = mapped_column(Boolean, default=False)
    aftercare_organized: Mapped[bool] = mapped_column(Boolean, default=False)

    # Nach-Entlassung
    followup_gp: Mapped[str | None] = mapped_column(String(255))  # Hausarzt-Termin
    followup_gp_date: Mapped[date | None] = mapped_column(Date)
    followup_spitex: Mapped[str | None] = mapped_column(String(255))  # Spitex-Termin
    followup_spitex_date: Mapped[date | None] = mapped_column(Date)

    notes: Mapped[str | None] = mapped_column(Text)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )
