"""VitalSign, Encounter, Alarm, Medication, MedicationAdministration, NursingEntry, NursingAssessment, ClinicalNote models."""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database import Base


class VitalSign(Base):
    __tablename__ = "vital_signs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
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
    admitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
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
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    acknowledged_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))


# ─── Medikamenten-Modul ───────────────────────────────────────


class Medication(Base):
    """Medikamentenverordnung für einen Patienten.

    Bildet die ärztliche Verordnung ab:
    - welches Medikament (Name, ATC-Code, Wirkstoff)
    - Dosierung + Einheit + Verabreichungsweg
    - Frequenz (z.B. '3x täglich', '08:00, 14:00, 20:00')
    - Zeitraum (start_date – end_date)
    - Status: active, paused, discontinued, completed
    """
    __tablename__ = "medications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    # Medikament
    name: Mapped[str] = mapped_column(String(255))  # Handelsname, z.B. "Dafalgan"
    generic_name: Mapped[str | None] = mapped_column(String(255))  # Wirkstoff, z.B. "Paracetamol"
    atc_code: Mapped[str | None] = mapped_column(String(10))  # ATC-Klassifikation, z.B. "N02BE01"

    # Dosierung
    dose: Mapped[str] = mapped_column(String(50))  # z.B. "500", "10-20"
    dose_unit: Mapped[str] = mapped_column(String(20))  # mg, ml, IE, mcg, Tropfen
    route: Mapped[str] = mapped_column(String(30), default="oral")  # oral, iv, sc, im, topisch, inhalativ, rektal
    frequency: Mapped[str] = mapped_column(String(100))  # z.B. "3x täglich", "alle 8h", "bei Bedarf"

    # Zeitraum
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)

    # Status & Metadaten
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, paused, discontinued, completed
    reason: Mapped[str | None] = mapped_column(Text)  # Indikation / Grund
    notes: Mapped[str | None] = mapped_column(Text)  # Besondere Hinweise
    prescribed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))  # Verordnender Arzt
    is_prn: Mapped[bool] = mapped_column(Boolean, default=False)  # Bei Bedarf (pro re nata)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    # Relationships
    administrations: Mapped[list["MedicationAdministration"]] = relationship(
        back_populates="medication", cascade="all, delete-orphan", order_by="MedicationAdministration.administered_at.desc()"
    )


class MedicationAdministration(Base):
    """Dokumentation einer einzelnen Medikamenten-Verabreichung.

    Wann wurde welche Dosis tatsächlich gegeben, von wem, und gab es Besonderheiten?
    """
    __tablename__ = "medication_administrations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("medications.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)

    # Verabreichung
    administered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    administered_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))  # Pflegeperson
    dose_given: Mapped[str] = mapped_column(String(50))  # Tatsächlich gegebene Dosis
    dose_unit: Mapped[str] = mapped_column(String(20))
    route: Mapped[str] = mapped_column(String(30))

    # Status
    status: Mapped[str] = mapped_column(String(20), default="completed")  # completed, refused, held, not-given
    reason_not_given: Mapped[str | None] = mapped_column(Text)  # Falls nicht gegeben
    notes: Mapped[str | None] = mapped_column(Text)

    # Relationship
    medication: Mapped["Medication"] = relationship(back_populates="administrations")


# ─── Pflege-Dokumentation ──────────────────────────────────────


class NursingEntry(Base):
    """Pflegeeintrag — dokumentiert pflegerische Massnahmen, Beobachtungen und Interventionen.

    Kategorien:
    - observation: Beobachtung (z.B. „Patient klagt über Übelkeit")
    - intervention: Intervention/Massnahme (z.B. „Lagerung links, Infusion gewechselt")
    - assessment: Verweis auf ein strukturiertes Assessment
    - handover: Übergabe-Notiz
    - wound_care: Wundversorgung
    - mobility: Mobilisation
    - nutrition: Ernährung/Flüssigkeit
    - elimination: Ausscheidung
    - communication: Kommunikation mit Patient/Angehörigen
    """
    __tablename__ = "nursing_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    # Kategorisierung
    category: Mapped[str] = mapped_column(String(30))  # observation, intervention, assessment, handover, ...
    title: Mapped[str] = mapped_column(String(255))  # Kurzbezeichnung
    content: Mapped[str] = mapped_column(Text)  # Freitextinhalt
    priority: Mapped[str] = mapped_column(String(20), default="normal")  # low, normal, high, urgent

    # Metadaten
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))  # Pflegeperson
    is_handover: Mapped[bool] = mapped_column(Boolean, default=False)  # Übergabe-relevant

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )


class NursingAssessment(Base):
    """Strukturiertes Pflege-Assessment (Barthel-Index, Norton-Skala, Braden, etc.).

    Die einzelnen Items und der berechnete Score werden als JSON in `items` gespeichert.
    `assessment_type` bestimmt, welches Assessment-Schema verwendet wird.
    """
    __tablename__ = "nursing_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    # Assessment-Typ
    assessment_type: Mapped[str] = mapped_column(String(30))  # barthel, norton, braden, pain, fall_risk, nutrition
    total_score: Mapped[int] = mapped_column(Integer)  # Gesamtpunktzahl
    max_score: Mapped[int | None] = mapped_column(Integer)  # Maximaler Score des Assessment-Schemas
    risk_level: Mapped[str | None] = mapped_column(String(20))  # low, medium, high, very_high

    # Items als JSON — z.B. {"essen": 10, "transfer": 15, "koerperpflege": 5, ...}
    items: Mapped[dict] = mapped_column(JSONB, default=dict)
    notes: Mapped[str | None] = mapped_column(Text)

    # Metadaten
    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    assessed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


# ─── Klinische Notizen (Arzt-Berichte, Verlauf) ───────────────


class ClinicalNote(Base):
    """Klinische Notiz — ärztliche Verlaufsberichte, Konsilien, Aufnahme-/Entlassberichte.

    Typen:
    - progress_note: Verlaufsnotiz (häufigstes Format)
    - admission_note: Aufnahmebericht
    - discharge_summary: Entlassbericht / Austrittsbericht
    - consultation: Konsilbericht
    - procedure_note: Interventionsbericht
    - handoff: Dienstübergabe (ärztlich)
    """
    __tablename__ = "clinical_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    encounter_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("encounters.id"))

    # Typ & Inhalt
    note_type: Mapped[str] = mapped_column(String(30))  # progress_note, admission_note, discharge_summary, consultation, procedure_note, handoff
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)  # Rich-Text / Markdown
    summary: Mapped[str | None] = mapped_column(Text)  # Optionale Kurzfassung

    # Autor & Co-Signatur
    author_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    co_signed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    co_signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Status
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, final, amended, entered_in_error
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=False)

    # Tags / Metadaten
    tags: Mapped[dict | None] = mapped_column(JSONB)  # z.B. ["kardiologie", "akut"]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
