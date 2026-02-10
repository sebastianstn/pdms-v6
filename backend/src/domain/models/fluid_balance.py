"""FluidBalance model — Intake/Output tracking for I/O balance (Einfuhr/Ausfuhr)."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


class FluidEntry(Base):
    """Single fluid intake or output entry.

    Direction: 'intake' (Einfuhr) or 'output' (Ausfuhr).
    Categories:
      Intake:  infusion, oral, medication, blood_product, nutrition, other_intake
      Output:  urine, drain, vomit, stool, perspiratio, blood_loss, other_output
    """

    __tablename__ = "fluid_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    # ─── Direction & Category ───────────────────────────────
    direction: Mapped[str] = mapped_column(String(10))        # 'intake' or 'output'
    category: Mapped[str] = mapped_column(String(30))         # see doc above
    display_name: Mapped[str] = mapped_column(String(200))    # e.g. "NaCl 0.9% 1000ml", "Urin"

    # ─── Volume ─────────────────────────────────────────────
    volume_ml: Mapped[float] = mapped_column(Float)           # always in mL
    route: Mapped[str | None] = mapped_column(String(30))     # iv, oral, subcutaneous, rectal, ng_tube, catheter, etc.

    # ─── Timing ─────────────────────────────────────────────
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    # ─── Metadata ───────────────────────────────────────────
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
