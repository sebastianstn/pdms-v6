"""LabResult model — Laboratory result values with LOINC codes and reference ranges."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


class LabResult(Base):
    """Single laboratory result value (one analyte per row)."""

    __tablename__ = "lab_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    # ─── Analyte identification ─────────────────────────────
    analyte: Mapped[str] = mapped_column(String(50), index=True)          # e.g. "crp", "leukocytes", "creatinine"
    loinc_code: Mapped[str | None] = mapped_column(String(20))            # e.g. "1988-5"
    display_name: Mapped[str] = mapped_column(String(100))                # e.g. "CRP (C-reaktives Protein)"

    # ─── Value ──────────────────────────────────────────────
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(20))                         # e.g. "mg/L", "×10⁹/L", "µmol/L"

    # ─── Reference range ────────────────────────────────────
    ref_min: Mapped[float | None] = mapped_column(Float)
    ref_max: Mapped[float | None] = mapped_column(Float)

    # ─── Interpretation ─────────────────────────────────────
    flag: Mapped[str | None] = mapped_column(String(10))                  # "H" (high), "L" (low), "HH" (critical high), "LL" (critical low), null (normal)
    interpretation: Mapped[str | None] = mapped_column(String(20))        # "normal", "borderline", "pathological", "critical"

    # ─── Trend (computed or imported) ───────────────────────
    trend: Mapped[str | None] = mapped_column(String(5))                  # "↑", "↓", "→", "↑↑", "↓↓"
    previous_value: Mapped[float | None] = mapped_column(Float)

    # ─── Metadata ───────────────────────────────────────────
    category: Mapped[str] = mapped_column(String(30), default="chemistry")  # chemistry, hematology, coagulation, blood_gas, urinalysis
    sample_type: Mapped[str | None] = mapped_column(String(30))            # venous_blood, arterial_blood, urine, csf
    collected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resulted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    ordered_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    validated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    order_number: Mapped[str | None] = mapped_column(String(50), index=True)  # Lab order group
    notes: Mapped[str | None] = mapped_column(Text)
    extra: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
