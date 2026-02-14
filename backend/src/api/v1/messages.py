"""Interne Mitteilungszentrale — gezielter Versand an angelegte User."""

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.models.system import AppUser, UserMessage
from src.domain.schemas.message import (
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    MessageUserResponse,
    UnreadCountResponse,
)

router = APIRouter()

CurrentUser = Annotated[dict, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]


async def _ensure_current_app_user(db: AsyncSession, user: dict) -> AppUser:
    """Gibt lokalen AppUser zurück oder legt ihn beim ersten Zugriff automatisch an."""
    sub = user.get("sub")
    username = user.get("preferred_username") or "unbekannt"
    keycloak_id = str(sub) if sub else f"local-{username}"

    by_keycloak = await db.execute(select(AppUser).where(AppUser.keycloak_id == keycloak_id))
    app_user = by_keycloak.scalars().first()
    if app_user:
        return app_user

    by_username = await db.execute(select(AppUser).where(AppUser.username == username))
    app_user = by_username.scalars().first()
    if app_user:
        if not app_user.keycloak_id:
            app_user.keycloak_id = keycloak_id
            await db.flush()
        return app_user

    roles = user.get("realm_access", {}).get("roles", [])
    role = "pflege"
    if "admin" in roles:
        role = "admin"
    elif "arzt" in roles:
        role = "arzt"

    new_user = AppUser(
        keycloak_id=keycloak_id,
        username=username,
        email=user.get("email") or f"{username}@pdms.local",
        first_name="",
        last_name="",
        role=role,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)
    return new_user


async def _get_user_or_404(db: AsyncSession, user_id: uuid.UUID) -> AppUser:
    """Lädt Empfänger oder wirft 404."""
    result = await db.execute(select(AppUser).where(AppUser.id == user_id, AppUser.is_active.is_(True)))
    app_user = result.scalar_one_or_none()
    if not app_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Benutzer nicht gefunden.")
    return app_user


@router.get("/messages/users", response_model=list[MessageUserResponse])
async def list_message_users(db: DB, user: CurrentUser):
    """Listet aktive Benutzer für die Empfänger-Auswahl im Chat."""
    current_user = await _ensure_current_app_user(db, user)

    result = await db.execute(
        select(AppUser)
        .where(AppUser.is_active.is_(True), AppUser.id != current_user.id)
        .order_by(AppUser.username.asc())
    )
    users = result.scalars().all()

    payload: list[MessageUserResponse] = []
    for u in users:
        full_name = " ".join(part for part in [u.first_name, u.last_name] if part) or None
        payload.append(
            MessageUserResponse(
                id=u.id,
                username=u.username,
                full_name=full_name,
                role=u.role,
            )
        )
    return payload


@router.get("/messages/unread-count", response_model=UnreadCountResponse)
async def unread_count(db: DB, user: CurrentUser):
    """Liefert Anzahl ungelesener Nachrichten für den aktuellen Benutzer."""
    current_user = await _ensure_current_app_user(db, user)

    result = await db.execute(
        select(func.count(UserMessage.id)).where(
            UserMessage.recipient_user_id == current_user.id,
            UserMessage.is_read.is_(False),
        )
    )
    return UnreadCountResponse(unread=result.scalar_one() or 0)


@router.get("/messages/conversation/{other_user_id}", response_model=ConversationResponse)
async def get_conversation(
    other_user_id: uuid.UUID,
    db: DB,
    user: CurrentUser,
    limit: int = Query(100, ge=1, le=300),
):
    """Lädt den Chat-Verlauf mit einem ausgewählten Benutzer."""
    current_user = await _ensure_current_app_user(db, user)
    other_user = await _get_user_or_404(db, other_user_id)

    if current_user.id == other_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Eigen-Chat ist nicht verfügbar.")

    stmt = (
        select(UserMessage)
        .where(
            or_(
                and_(
                    UserMessage.sender_user_id == current_user.id,
                    UserMessage.recipient_user_id == other_user.id,
                ),
                and_(
                    UserMessage.sender_user_id == other_user.id,
                    UserMessage.recipient_user_id == current_user.id,
                ),
            )
        )
        .order_by(UserMessage.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = list(reversed(result.scalars().all()))

    await db.execute(
        update(UserMessage)
        .where(
            UserMessage.sender_user_id == other_user.id,
            UserMessage.recipient_user_id == current_user.id,
            UserMessage.is_read.is_(False),
        )
        .values(is_read=True, read_at=datetime.now(UTC))
    )

    messages = [
        MessageResponse(
            id=row.id,
            sender_user_id=row.sender_user_id,
            sender_username=current_user.username if row.sender_user_id == current_user.id else other_user.username,
            recipient_user_id=row.recipient_user_id,
            recipient_username=current_user.username if row.recipient_user_id == current_user.id else other_user.username,
            content=row.content,
            is_read=row.is_read if row.sender_user_id == current_user.id else True,
            read_at=row.read_at,
            created_at=row.created_at,
        )
        for row in rows
    ]

    return ConversationResponse(
        current_user_id=current_user.id,
        other_user_id=other_user.id,
        messages=messages,
    )


@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(payload: MessageCreate, db: DB, user: CurrentUser):
    """Sendet eine neue Mitteilung an einen ausgewählten Empfänger."""
    current_user = await _ensure_current_app_user(db, user)
    recipient = await _get_user_or_404(db, payload.recipient_user_id)

    if recipient.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nachricht an sich selbst ist nicht erlaubt.")

    message = UserMessage(
        sender_user_id=current_user.id,
        recipient_user_id=recipient.id,
        content=payload.content.strip(),
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)

    return MessageResponse(
        id=message.id,
        sender_user_id=message.sender_user_id,
        sender_username=current_user.username,
        recipient_user_id=message.recipient_user_id,
        recipient_username=recipient.username,
        content=message.content,
        is_read=message.is_read,
        read_at=message.read_at,
        created_at=message.created_at,
    )
