"""Phase 3c Models — Therapieplan, Konsilien, Arztbriefe, Pflegediagnosen,
Schichtübergabe, Ernährung, Verbrauchsmaterial."""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database import Base


# ─── Therapieplan ──────────────────────────────────────────────

class TreatmentPlan(Base):
    """Therapieplan — ärztlich verordneter Behandlungsplan."""
    __tablename__ = "treatment_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    title: Mapped[str] = mapped_column(String(255))
    diagnosis: Mapped[str] = mapped_column(Text)
    icd_code: Mapped[str | None] = mapped_column(String(20))

    goals: Mapped[str] = mapped_column(Text)
    interventions: Mapped[str] = mapped_column(Text)

    start_date: Mapped[date] = mapped_column(Date)
    target_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)

    status: Mapped[str] = mapped_column(String(20), default="active")  # active, completed, cancelled, on-hold
    priority: Mapped[str] = mapped_column(String(20), default="normal")  # low, normal, high, urgent

    responsible_physician_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    review_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    extra: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )

    items: Mapped[list["TreatmentPlanItem"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan", order_by="TreatmentPlanItem.sort_order",
    )


class TreatmentPlanItem(Base):
    """Einzelne Massnahme innerhalb eines Therapieplans."""
    __tablename__ = "treatment_plan_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("treatment_plans.id", ondelete="CASCADE"), index=True)

    item_type: Mapped[str] = mapped_column(String(30))  # medication, physiotherapy, lab, imaging, nursing, other
    description: Mapped[str] = mapped_column(Text)
    frequency: Mapped[str | None] = mapped_column(String(100))
    duration: Mapped[str | None] = mapped_column(String(100))

    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, in_progress, completed, cancelled
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text)

    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    plan: Mapped["TreatmentPlan"] = relationship(back_populates="items")


# ─── Konsilien ─────────────────────────────────────────────────

class Consultation(Base):
    """Konsil — Anfrage an eine Fachdisziplin."""
    __tablename__ = "consultations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    specialty: Mapped[str] = mapped_column(String(100))  # kardiologie, neurologie, chirurgie, etc.
    urgency: Mapped[str] = mapped_column(String(20), default="routine")  # routine, urgent, emergency
    question: Mapped[str] = mapped_column(Text)
    clinical_context: Mapped[str | None] = mapped_column(Text)

    requested_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    consultant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    consultant_name: Mapped[str | None] = mapped_column(String(200))

    response: Mapped[str | None] = mapped_column(Text)
    recommendations: Mapped[str | None] = mapped_column(Text)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[str] = mapped_column(String(20), default="requested")  # requested, accepted, completed, cancelled

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── Arztbriefe ────────────────────────────────────────────────

class MedicalLetter(Base):
    """Arztbrief — Entlass-/Zuweisungs-/Verlaufsbriefe."""
    __tablename__ = "medical_letters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    letter_type: Mapped[str] = mapped_column(String(30))  # discharge, referral, progress, transfer
    title: Mapped[str] = mapped_column(String(255))

    recipient_name: Mapped[str | None] = mapped_column(String(200))
    recipient_institution: Mapped[str | None] = mapped_column(String(255))
    recipient_email: Mapped[str | None] = mapped_column(String(255))

    diagnosis: Mapped[str | None] = mapped_column(Text)
    history: Mapped[str | None] = mapped_column(Text)
    findings: Mapped[str | None] = mapped_column(Text)
    therapy: Mapped[str | None] = mapped_column(Text)
    procedures: Mapped[str | None] = mapped_column(Text)
    recommendations: Mapped[str | None] = mapped_column(Text)
    medication_on_discharge: Mapped[str | None] = mapped_column(Text)
    follow_up: Mapped[str | None] = mapped_column(Text)

    content: Mapped[str | None] = mapped_column(Text)  # Freitext-Fallback

    author_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    co_signed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    co_signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, final, sent, amended
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_via: Mapped[str | None] = mapped_column(String(30))  # hin_mail, email, fax, print

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── Pflegediagnosen ──────────────────────────────────────────

class NursingDiagnosis(Base):
    """Pflegediagnose nach NANDA-I Klassifikation."""
    __tablename__ = "nursing_diagnoses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    nanda_code: Mapped[str | None] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(255))
    domain: Mapped[str | None] = mapped_column(String(100))  # NANDA-Domain

    defining_characteristics: Mapped[str | None] = mapped_column(Text)
    related_factors: Mapped[str | None] = mapped_column(Text)
    risk_factors: Mapped[str | None] = mapped_column(Text)

    goals: Mapped[str | None] = mapped_column(Text)  # NOC-Outcomes
    interventions: Mapped[str | None] = mapped_column(Text)  # NIC-Interventionen
    evaluation: Mapped[str | None] = mapped_column(Text)

    priority: Mapped[str] = mapped_column(String(20), default="normal")  # low, normal, high
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, resolved, inactive

    diagnosed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    diagnosed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── Schichtübergabe ──────────────────────────────────────────

class ShiftHandover(Base):
    """Strukturierte Schichtübergabe zwischen Pflegepersonal."""
    __tablename__ = "shift_handovers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    shift_type: Mapped[str] = mapped_column(String(20))  # early, late, night
    handover_date: Mapped[date] = mapped_column(Date, index=True)

    # SBAR-Struktur
    situation: Mapped[str] = mapped_column(Text)
    background: Mapped[str | None] = mapped_column(Text)
    assessment: Mapped[str | None] = mapped_column(Text)
    recommendation: Mapped[str | None] = mapped_column(Text)

    open_tasks: Mapped[dict | None] = mapped_column(JSONB)  # [{task, priority, due}]
    critical_info: Mapped[str | None] = mapped_column(Text)

    handed_over_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    received_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


# ─── Ernährung ─────────────────────────────────────────────────

class NutritionOrder(Base):
    """Ernährungsplan / Diätverordnung."""
    __tablename__ = "nutrition_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    diet_type: Mapped[str] = mapped_column(String(50))  # normal, light, diabetic, renal, parenteral, enteral, npo
    texture: Mapped[str | None] = mapped_column(String(30))  # normal, pureed, liquid, soft
    supplements: Mapped[str | None] = mapped_column(Text)
    restrictions: Mapped[str | None] = mapped_column(Text)  # Allergien, Unverträglichkeiten
    allergies: Mapped[str | None] = mapped_column(Text)

    caloric_target: Mapped[int | None] = mapped_column(Integer)  # kcal/Tag
    protein_target: Mapped[float | None] = mapped_column(Float)  # g/Tag
    fluid_target: Mapped[int | None] = mapped_column(Integer)  # ml/Tag

    special_instructions: Mapped[str | None] = mapped_column(Text)

    status: Mapped[str] = mapped_column(String(20), default="active")  # active, on-hold, completed, cancelled
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)

    ordered_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


class NutritionScreening(Base):
    """Ernährungs-Screening (NRS-2002, MUST, etc.)."""
    __tablename__ = "nutrition_screenings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)

    screening_type: Mapped[str] = mapped_column(String(30))  # nrs2002, must, mna, sga
    total_score: Mapped[int] = mapped_column(Integer)
    risk_level: Mapped[str] = mapped_column(String(20))  # low, medium, high
    items: Mapped[dict] = mapped_column(JSONB, default=dict)
    notes: Mapped[str | None] = mapped_column(Text)

    screened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    screened_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


# ─── Verbrauchsmaterial ────────────────────────────────────────

class SupplyItem(Base):
    """Verbrauchsmaterial-Katalog."""
    __tablename__ = "supply_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    article_number: Mapped[str | None] = mapped_column(String(50), unique=True)
    category: Mapped[str] = mapped_column(String(50))  # wound_care, infusion, catheter, respiratory, other
    unit: Mapped[str] = mapped_column(String(20))  # piece, pack, ml, set
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class SupplyUsage(Base):
    """Dokumentation des Verbrauchsmaterial-Einsatzes pro Patient."""
    __tablename__ = "supply_usages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    supply_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("supply_items.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    quantity: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str | None] = mapped_column(Text)

    used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    used_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
