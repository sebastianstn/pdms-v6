"""RBAC Permission Model — Zugriffsberechtigungen pro Rolle und Ressource."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database import Base


class RbacPermission(Base):
    """Speichert Zugriffsberechtigungen (R/RW/—) pro Rolle und Ressource."""

    __tablename__ = "rbac_permissions"
    __table_args__ = (
        UniqueConstraint("role", "resource", name="uq_rbac_role_resource"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    role: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    resource: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    access: Mapped[str] = mapped_column(String(5), nullable=False, default="—")  # "R", "RW", "—"
    updated_by: Mapped[str | None] = mapped_column(String(100))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
