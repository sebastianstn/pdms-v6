"""Patient, Insurance, EmergencyContact, MedicalProvider models."""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ahv_number: Mapped[str | None] = mapped_column(String(16), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    date_of_birth: Mapped[date] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(20))  # male, female, other, unknown
    blood_type: Mapped[str | None] = mapped_column(String(5))
    phone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    address_street: Mapped[str | None] = mapped_column(String(255))
    address_zip: Mapped[str | None] = mapped_column(String(10))
    address_city: Mapped[str | None] = mapped_column(String(100))
    address_canton: Mapped[str | None] = mapped_column(String(2))
    language: Mapped[str] = mapped_column(String(5), default="de")
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, discharged, deceased
    photo_url: Mapped[str | None] = mapped_column(String(500))
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    insurances: Mapped[list["Insurance"]] = relationship(back_populates="patient", cascade="all, delete-orphan")
    contacts: Mapped[list["EmergencyContact"]] = relationship(back_populates="patient", cascade="all, delete-orphan")
    providers: Mapped[list["MedicalProvider"]] = relationship(back_populates="patient", cascade="all, delete-orphan")


class Insurance(Base):
    """Versicherung — Grund/Zusatz/Unfall/IV, Franchise, Kostengutsprache, Garant."""
    __tablename__ = "insurances"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    insurer_name: Mapped[str] = mapped_column(String(255))
    policy_number: Mapped[str] = mapped_column(String(50))
    insurance_type: Mapped[str] = mapped_column(String(30))  # grundversicherung, zusatz, unfall, iv
    valid_from: Mapped[date | None] = mapped_column(Date)
    valid_until: Mapped[date | None] = mapped_column(Date)

    # Phase 3a.12 Erweiterungen
    franchise: Mapped[int | None] = mapped_column(Integer)  # CHF z.B. 300, 500, 1000, 1500, 2000, 2500
    kostengutsprache: Mapped[bool] = mapped_column(Boolean, default=False)  # Kostengutsprache erteilt?
    kostengutsprache_bis: Mapped[date | None] = mapped_column(Date)  # Gültig bis
    garant: Mapped[str | None] = mapped_column(String(30))  # tiers_payant, tiers_garant
    bvg_number: Mapped[str | None] = mapped_column(String(50))  # BVG-Versicherungsnummer (Unfall)
    notes: Mapped[str | None] = mapped_column(Text)

    patient: Mapped["Patient"] = relationship(back_populates="insurances")


class EmergencyContact(Base):
    """Notfallkontakt — Priorität, Vertretungsberechtigung, Schlüsselperson."""
    __tablename__ = "emergency_contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(200))
    relationship_type: Mapped[str] = mapped_column(String(50))  # partner, kind, eltern, geschwister, freund, nachbar
    phone: Mapped[str] = mapped_column(String(20))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    # Phase 3a.13 Erweiterungen
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(String(255))
    priority: Mapped[int] = mapped_column(Integer, default=2)  # 1 = erste Kontaktperson
    is_legal_representative: Mapped[bool] = mapped_column(Boolean, default=False)  # Vertretungsberechtigt
    is_key_person: Mapped[bool] = mapped_column(Boolean, default=False)  # Schlüsselperson (hat Wohnungsschlüssel etc.)
    notes: Mapped[str | None] = mapped_column(Text)

    patient: Mapped["Patient"] = relationship(back_populates="contacts")


class MedicalProvider(Base):
    """Medizinische Zuweiser / Leistungserbringer — Hausarzt, Zuweiser, Apotheke, Spitex.

    Phase 3a.14: Mit HIN-Mail und GLN-Nummer für Schweizer Gesundheitswesen.
    """
    __tablename__ = "medical_providers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)

    provider_type: Mapped[str] = mapped_column(String(30))
    # hausarzt, zuweiser, apotheke, spitex, physiotherapie, spezialist

    name: Mapped[str] = mapped_column(String(255))  # Name oder Praxisname
    contact_person: Mapped[str | None] = mapped_column(String(200))  # Ansprechperson
    phone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    hin_email: Mapped[str | None] = mapped_column(String(255))  # HIN-Mail-Adresse
    gln_number: Mapped[str | None] = mapped_column(String(13))  # GLN / EAN 13-stellig
    address: Mapped[str | None] = mapped_column(String(255))
    speciality: Mapped[str | None] = mapped_column(String(100))  # Fachgebiet
    notes: Mapped[str | None] = mapped_column(Text)

    patient: Mapped["Patient"] = relationship(back_populates="providers")
