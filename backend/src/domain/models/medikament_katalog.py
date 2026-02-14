"""Medikamenten-Katalog — Zugelassene Medikamente Schweiz (Swissmedic)."""

import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


class MedikamentKatalog(Base):
    """Katalog zugelassener Medikamente für Autovervollständigung."""
    __tablename__ = "medikament_katalog"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(300), index=True)               # Handelsname (z.B. Dafalgan)
    wirkstoff: Mapped[str] = mapped_column(String(300), index=True)           # Generika/Wirkstoff (z.B. Paracetamol)
    hersteller: Mapped[str | None] = mapped_column(String(200))               # Hersteller (z.B. UPSA)
    dosis: Mapped[str | None] = mapped_column(String(100))                    # Dosierung (z.B. 500 mg)
    form: Mapped[str | None] = mapped_column(String(100))                     # Darreichungsform (Tablette, Lösung)
    route: Mapped[str | None] = mapped_column(String(50))                     # Verabreichungsweg (oral, iv, sc)
    route_label: Mapped[str | None] = mapped_column(String(50))               # Kurzform (p.o., i.v., s.c.)
    atc_code: Mapped[str | None] = mapped_column(String(20), index=True)      # ATC-Code
    kategorie: Mapped[str | None] = mapped_column(String(100))                # Therapeutische Kategorie
