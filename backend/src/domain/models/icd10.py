"""ICD-10 Katalog — Diagnosekodierung nach WHO/DIMDI."""

import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


class Icd10Code(Base):
    """ICD-10 Katalogeinträge für Diagnose-Autovervollständigung."""
    __tablename__ = "icd10_catalog"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500))
    chapter: Mapped[str | None] = mapped_column(String(10))  # I-XXII
    block: Mapped[str | None] = mapped_column(String(20))  # z.B. I00-I99
    category: Mapped[str | None] = mapped_column(String(100))  # z.B. Kreislaufsystem
