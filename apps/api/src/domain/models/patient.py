"""Patient, Insurance, EmergencyContact models."""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String
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


class Insurance(Base):
    __tablename__ = "insurances"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    insurer_name: Mapped[str] = mapped_column(String(255))
    policy_number: Mapped[str] = mapped_column(String(50))
    insurance_type: Mapped[str] = mapped_column(String(30))  # grundversicherung, zusatz, unfall, iv
    valid_from: Mapped[date | None] = mapped_column(Date)
    valid_until: Mapped[date | None] = mapped_column(Date)

    patient: Mapped["Patient"] = relationship(back_populates="insurances")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(200))
    relationship_type: Mapped[str] = mapped_column(String(50))
    phone: Mapped[str] = mapped_column(String(20))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    patient: Mapped["Patient"] = relationship(back_populates="contacts")
