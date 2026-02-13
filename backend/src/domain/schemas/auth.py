"""Auth Pydantic schemas — Token-Payload und Benutzer-Repräsentationen."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TokenPayload(BaseModel):
    """Dekodierter JWT-Token-Payload (Keycloak)."""
    sub: str = Field(..., description="Keycloak User-ID")
    preferred_username: str | None = None
    email: str | None = None
    name: str | None = None
    realm_access: dict | None = None
    gln: str | None = None
    department: str | None = None
    exp: int | None = None
    iat: int | None = None

    @property
    def user_id(self) -> str:
        """Gibt die User-ID (sub) zurück."""
        return self.sub

    @property
    def roles(self) -> list[str]:
        """Extrahiert die Rollen aus realm_access."""
        if self.realm_access and "roles" in self.realm_access:
            return self.realm_access["roles"]
        return []

    def has_role(self, role: str) -> bool:
        """Prüft ob der Benutzer eine bestimmte Rolle hat."""
        return role in self.roles


class UserInfo(BaseModel):
    """Benutzerinformationen für die Frontend-Anzeige."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    email: str
    role: str
    is_active: bool = True
    last_login: datetime | None = None


class UserCreate(BaseModel):
    """Schema zum Erstellen eines neuen Benutzers."""
    keycloak_id: str = Field(..., min_length=1, max_length=255)
    username: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., pattern=r"^(arzt|pflege|admin)$")


class UserUpdate(BaseModel):
    """Schema zum Aktualisieren eines Benutzers."""
    email: str | None = Field(None, max_length=255)
    role: str | None = Field(None, pattern=r"^(arzt|pflege|admin)$")
    is_active: bool | None = None
