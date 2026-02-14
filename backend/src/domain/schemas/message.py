"""Schemas für interne Mitteilungszentrale."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    """Payload zum Senden einer Mitteilung."""

    recipient_user_id: uuid.UUID
    content: str = Field(..., min_length=1, max_length=2000)


class MessageUserResponse(BaseModel):
    """Benutzer für Empfänger-Auswahl im Chat."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    full_name: str | None = None
    role: str


class MessageResponse(BaseModel):
    """Einzelne Chat-Nachricht."""

    id: uuid.UUID
    sender_user_id: uuid.UUID
    sender_username: str
    recipient_user_id: uuid.UUID
    recipient_username: str
    content: str
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime


class ConversationResponse(BaseModel):
    """Chat-Verlauf zwischen aktuellem User und einem Gegenüber."""

    current_user_id: uuid.UUID
    other_user_id: uuid.UUID
    messages: list[MessageResponse]


class UnreadCountResponse(BaseModel):
    """Anzahl ungelesener Mitteilungen."""

    unread: int
