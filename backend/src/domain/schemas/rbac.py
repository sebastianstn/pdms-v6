"""Pydantic-Schemas für RBAC-Permissions."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RbacPermissionResponse(BaseModel):
    """Response-Schema für eine einzelne Berechtigung."""
    id: UUID
    role: str
    resource: str
    access: str  # "R", "RW", "—"
    updated_by: str | None = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RbacPermissionUpdate(BaseModel):
    """Request-Schema zum Ändern einer Berechtigung."""
    role: str = Field(..., min_length=1, max_length=30)
    resource: str = Field(..., min_length=1, max_length=100)
    access: str = Field(..., pattern=r"^(R|RW|—)$")


class RbacMatrixRow(BaseModel):
    """Eine Zeile der RBAC-Matrix (eine Ressource mit Berechtigungen pro Rolle)."""
    resource: str
    arzt: str = "—"
    pflege: str = "—"
    fage: str = "—"
    admin: str = "—"


class RbacMatrixResponse(BaseModel):
    """Vollständige RBAC-Matrix."""
    roles: list[str]
    resources: list[str]
    matrix: list[RbacMatrixRow]
