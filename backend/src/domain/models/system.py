"""AppUser, AuditLog models."""

import hashlib
import os
import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


class AppUser(Base):
    """Benutzer des PDMS — mit optionalem lokalen Passwort-Hash."""

    __tablename__ = "app_users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    keycloak_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(default=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # ── Passwort-Hashing (SHA-256 + Salt, ohne externe Abhängigkeit) ──

    @staticmethod
    def hash_password(password: str) -> str:
        """Erstellt einen gesalzenen SHA-256 Hash."""
        salt = os.urandom(16).hex()
        hashed = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
        return f"{salt}${hashed}"

    def verify_password(self, password: str) -> bool:
        """Prüft ob das Passwort korrekt ist."""
        if not self.password_hash:
            return False
        salt, stored_hash = self.password_hash.split("$", 1)
        computed = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
        return computed == stored_hash

    def set_password(self, password: str) -> None:
        """Setzt ein neues Passwort."""
        self.password_hash = self.hash_password(password)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    user_role: Mapped[str] = mapped_column(String(20))
    action: Mapped[str] = mapped_column(String(50))  # create, read, update, delete
    resource_type: Mapped[str] = mapped_column(String(50))  # patient, vital_sign, medication, etc.
    resource_id: Mapped[str | None] = mapped_column(String(100))
    details: Mapped[dict] = mapped_column(JSONB, default=dict)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class UserMessage(Base):
    """Interne Mitteilung zwischen zwei App-Usern."""

    __tablename__ = "user_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_users.id", ondelete="CASCADE"),
        index=True,
    )
    recipient_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_users.id", ondelete="CASCADE"),
        index=True,
    )
    content: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
