"""Legal models — Phase 3a: Consent, AdvanceDirective, PatientWishes, PalliativeCare, DeathNotification.

Schweizer Recht:
- Einwilligungen: nDSG, EPDG, OR/ZGB Behandlungsvertrag
- Patientenverfügung: ZGB Art. 370–373
- Vorsorgeauftrag: ZGB Art. 360–369
- Mutmasslicher Wille: ZGB Art. 378
"""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


# ─── 3a.4 Einwilligungen ──────────────────────────────────────


class Consent(Base):
    """Einwilligung — 6 Typen gemäss Wireframe Rechtliche-Tab.

    Typen:
    - home_spital: Einwilligung Home-Spital-Behandlung
    - iv_antibiotics: Einwilligung i.v.-Antibiotikatherapie
    - telemedizin: Einwilligung Telemedizin / Teleconsult
    - ndsg: Datenbearbeitung gemäss nDSG (neues Datenschutzgesetz)
    - epdg: Elektronisches Patientendossier (EPDG)
    - thromboprophylaxe: Einwilligung Thromboseprophylaxe
    """
    __tablename__ = "consents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)

    consent_type: Mapped[str] = mapped_column(String(30))
    # home_spital, iv_antibiotics, telemedizin, ndsg, epdg, thromboprophylaxe

    status: Mapped[str] = mapped_column(String(20), default="pending")
    # pending, granted, refused, revoked

    granted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    granted_by: Mapped[str | None] = mapped_column(String(200))  # Name des Einwilligenden
    valid_from: Mapped[date | None] = mapped_column(Date)
    valid_until: Mapped[date | None] = mapped_column(Date)

    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_reason: Mapped[str | None] = mapped_column(Text)

    witness_name: Mapped[str | None] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── 3a.6 Patientenverfügungen ────────────────────────────────


class AdvanceDirective(Base):
    """Patientenverfügung & Vorsorgeauftrag — ZGB Art. 360–373.

    directive_type:
    - patientenverfuegung: FMH-Patientenverfügung
    - vorsorgeauftrag: Vorsorgeauftrag ZGB Art. 360
    """
    __tablename__ = "advance_directives"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)

    directive_type: Mapped[str] = mapped_column(String(30))
    # patientenverfuegung, vorsorgeauftrag

    # REA-Status
    rea_status: Mapped[str] = mapped_column(String(10), default="FULL")
    # FULL = volle Reanimation, DNR = Do Not Resuscitate

    # Behandlungsgrenzen
    intensive_care: Mapped[bool] = mapped_column(Boolean, default=True)  # Intensivmedizin ja/nein
    mechanical_ventilation: Mapped[bool] = mapped_column(Boolean, default=True)  # Beatmung ja/nein
    dialysis: Mapped[bool] = mapped_column(Boolean, default=True)  # Dialyse ja/nein
    artificial_nutrition: Mapped[bool] = mapped_column(Boolean, default=True)  # Künstl. Ernährung ja/nein

    # Vertrauensperson / Vertretungsberechtigte
    trusted_person_name: Mapped[str | None] = mapped_column(String(200))
    trusted_person_phone: Mapped[str | None] = mapped_column(String(20))
    trusted_person_relation: Mapped[str | None] = mapped_column(String(50))
    # FK → emergency_contacts optional
    trusted_person_contact_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("emergency_contacts.id"))

    # Dokument
    document_date: Mapped[date | None] = mapped_column(Date)
    storage_location: Mapped[str | None] = mapped_column(String(255))  # Wo aufbewahrt
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── 3a.8 Mutmasslicher Wille & Wünsche ───────────────────────


class PatientWishes(Base):
    """Mutmasslicher Wille (ZGB Art. 378) und persönliche Wünsche.

    Zwei Bereiche:
    1. Rechtlich relevant (ZGB 378): Lebensqualität, Autonomie, Schmerzbehandlung, Entscheidungsträger
    2. Persönliche Wünsche: Schlaf, Ernährung, Familie, Haustier, Spiritualität
    """
    __tablename__ = "patient_wishes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), unique=True, index=True)

    # ZGB Art. 378 — Mutmasslicher Wille
    quality_of_life: Mapped[str | None] = mapped_column(Text)  # Was bedeutet Lebensqualität?
    autonomy_preferences: Mapped[str | None] = mapped_column(Text)  # Autonomie-Wünsche
    pain_management: Mapped[str | None] = mapped_column(Text)  # Schmerzbehandlung-Wünsche
    decision_maker: Mapped[str | None] = mapped_column(String(200))  # Bevorzugter Entscheidungsträger
    decision_maker_contact_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("emergency_contacts.id"))

    # Persönliche Wünsche
    sleep_preferences: Mapped[str | None] = mapped_column(Text)
    nutrition_preferences: Mapped[str | None] = mapped_column(Text)
    family_wishes: Mapped[str | None] = mapped_column(Text)
    pet_info: Mapped[str | None] = mapped_column(Text)  # Haustier-Versorgung
    spiritual_needs: Mapped[str | None] = mapped_column(Text)
    other_wishes: Mapped[str | None] = mapped_column(Text)

    recorded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── 3a.9 Palliative Care ─────────────────────────────────────


class PalliativeCare(Base):
    """Palliativ-Plan und ACP-Reservemedikation.

    ACP = Advance Care Planning
    EMSP = Equipe Mobile de Soins Palliatifs
    """
    __tablename__ = "palliative_care"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), unique=True, index=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    activated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    # ACP-Reservemedikation
    reserve_morphin: Mapped[str | None] = mapped_column(String(100))  # z.B. "Morphin 5mg s.c. b.B."
    reserve_midazolam: Mapped[str | None] = mapped_column(String(100))
    reserve_haloperidol: Mapped[str | None] = mapped_column(String(100))
    reserve_scopolamin: Mapped[str | None] = mapped_column(String(100))
    reserve_other: Mapped[str | None] = mapped_column(Text)

    # Palliativdienst-Kontakt
    palliative_service_name: Mapped[str | None] = mapped_column(String(255))  # z.B. "EMSP Zürich"
    palliative_service_phone: Mapped[str | None] = mapped_column(String(20))
    palliative_service_email: Mapped[str | None] = mapped_column(String(255))

    goals_of_care: Mapped[str | None] = mapped_column(Text)  # Therapieziel-Beschreibung
    notes: Mapped[str | None] = mapped_column(Text)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC),
    )


# ─── 3a.10 Todesfall-Mitteilungen ─────────────────────────────


class DeathNotification(Base):
    """Kontaktliste und Anweisungen für den Todesfall.

    Priorität 1 = SOFORT benachrichtigen.
    """
    __tablename__ = "death_notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)

    # Kontakt
    contact_name: Mapped[str] = mapped_column(String(200))
    contact_phone: Mapped[str | None] = mapped_column(String(20))
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_role: Mapped[str | None] = mapped_column(String(100))  # z.B. "Pfarramt", "Bestatter", "Angehörige"
    emergency_contact_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("emergency_contacts.id"))

    priority: Mapped[int] = mapped_column(Integer, default=2)  # 1 = SOFORT, 2 = zeitnah, 3 = nachgelagert
    instructions: Mapped[str | None] = mapped_column(Text)  # Spezielle Anweisungen

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
