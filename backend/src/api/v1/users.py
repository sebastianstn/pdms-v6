"""User endpoints — Benutzerverwaltung (Admin CRUD + Passwort-Management)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.config import settings
from src.domain.models.system import AppUser
from src.domain.schemas.auth import PasswordReset, UserCreate, UserInfo, UserUpdate
from src.infrastructure.keycloak_admin import KeycloakAdminClient, KeycloakSyncError

router = APIRouter()

CurrentUser = Annotated[dict, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]


def _is_local_keycloak_id(value: str | None) -> bool:
    """Prüft, ob keycloak_id ein lokaler Platzhalter ist."""
    return not value or value.startswith("local-")


async def _kc_create_user(data: UserCreate) -> str:
    """Erstellt einen User in Keycloak und gibt die Keycloak-ID zurück."""
    client = KeycloakAdminClient()
    return await client.create_user(
        username=data.username,
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        password=data.password,
        role=data.role,
        enabled=True,
    )


async def _kc_update_user(user_id: str, data: UserUpdate, fallback_user: AppUser) -> None:
    """Aktualisiert einen User in Keycloak inklusive Rolle."""
    client = KeycloakAdminClient()
    await client.update_user(
        user_id=user_id,
        username=data.username if data.username is not None else fallback_user.username,
        email=data.email if data.email is not None else fallback_user.email,
        first_name=data.first_name if data.first_name is not None else fallback_user.first_name,
        last_name=data.last_name if data.last_name is not None else fallback_user.last_name,
        enabled=data.is_active if data.is_active is not None else fallback_user.is_active,
        role=data.role if data.role is not None else fallback_user.role,
    )


async def _kc_reset_password(user_id: str, password: str) -> None:
    """Setzt das Passwort in Keycloak zurück."""
    client = KeycloakAdminClient()
    await client.set_password(user_id=user_id, new_password=password)


async def _kc_delete_user(user_id: str) -> None:
    """Löscht den User in Keycloak."""
    client = KeycloakAdminClient()
    await client.delete_user(user_id=user_id)


# ─── GET /me — Aktueller Benutzer ────────────────────────────────

@router.get("/me")
async def get_me(user: CurrentUser):
    """Aktuellen Benutzer zurückgeben."""
    return {
        "sub": user.get("sub"),
        "username": user.get("preferred_username"),
        "email": user.get("email"),
        "name": user.get("name"),
        "roles": user.get("realm_access", {}).get("roles", []),
    }


# ─── GET /users — Alle Benutzer auflisten (Admin) ────────────────

@router.get("/users", response_model=list[UserInfo])
async def list_users(
    db: DB,
    user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: str | None = Query(None),
    is_active: bool | None = Query(None),
    search: str | None = Query(None, description="Suche nach Username oder Email"),
):
    """Listet alle Benutzer mit optionalen Filtern (nur Admin)."""
    _require_admin(user)

    stmt = select(AppUser).offset(skip).limit(limit).order_by(AppUser.username)

    if role:
        stmt = stmt.where(AppUser.role == role)
    if is_active is not None:
        stmt = stmt.where(AppUser.is_active == is_active)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            AppUser.username.ilike(pattern) | AppUser.email.ilike(pattern)
        )

    result = await db.execute(stmt)
    users = result.scalars().all()
    return users


# ─── GET /users/{id} — Einzelner Benutzer ────────────────────────

@router.get("/users/{user_id}", response_model=UserInfo)
async def get_user(user_id: uuid.UUID, db: DB, user: CurrentUser):
    """Gibt einen einzelnen Benutzer zurück (nur Admin)."""
    _require_admin(user)
    app_user = await _get_user_or_404(db, user_id)
    return app_user


# ─── POST /users — Neuer Benutzer mit Passwort ──────────────────

@router.post("/users", response_model=UserInfo, status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate, db: DB, user: CurrentUser):
    """Erstellt einen neuen Benutzer mit initialem Passwort (nur Admin)."""
    _require_admin(user)

    # Username-Duplikat prüfen
    existing = await db.execute(
        select(AppUser).where(AppUser.username == data.username)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Benutzername '{data.username}' existiert bereits.",
        )

    # Email-Duplikat prüfen
    existing_email = await db.execute(
        select(AppUser).where(AppUser.email == data.email)
    )
    if existing_email.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"E-Mail '{data.email}' existiert bereits.",
        )

    keycloak_id = f"local-{uuid.uuid4()}"
    if settings.keycloak_sync_users:
        try:
            keycloak_id = await _kc_create_user(data)
        except KeycloakSyncError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Keycloak-Synchronisierung fehlgeschlagen: {exc}",
            ) from exc

    new_user = AppUser(
        username=data.username,
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        role=data.role,
        keycloak_id=keycloak_id,
        is_active=True,
    )
    new_user.set_password(data.password)

    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)
    return new_user


# ─── PUT /users/{id} — Benutzer-Daten aktualisieren ──────────────

@router.put("/users/{user_id}", response_model=UserInfo)
async def update_user(
    user_id: uuid.UUID, data: UserUpdate, db: DB, user: CurrentUser
):
    """Aktualisiert Benutzer-Daten (nur Admin)."""
    _require_admin(user)
    app_user = await _get_user_or_404(db, user_id)

    update_data = data.model_dump(exclude_unset=True)

    # Username-Duplikat prüfen falls geändert
    if "username" in update_data and update_data["username"] != app_user.username:
        existing = await db.execute(
            select(AppUser).where(AppUser.username == update_data["username"])
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Benutzername '{update_data['username']}' existiert bereits.",
            )

    for field, value in update_data.items():
        setattr(app_user, field, value)

    if settings.keycloak_sync_users and not _is_local_keycloak_id(app_user.keycloak_id):
        try:
            await _kc_update_user(app_user.keycloak_id, data, app_user)
        except KeycloakSyncError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Keycloak-Synchronisierung fehlgeschlagen: {exc}",
            ) from exc

    await db.flush()
    await db.refresh(app_user)
    return app_user


# ─── PUT /users/{id}/password — Passwort zurücksetzen ─────────────

@router.put("/users/{user_id}/password")
async def reset_password(
    user_id: uuid.UUID, data: PasswordReset, db: DB, user: CurrentUser
):
    """Setzt das Passwort eines Benutzers zurück (nur Admin)."""
    _require_admin(user)
    app_user = await _get_user_or_404(db, user_id)

    if settings.keycloak_sync_users and not _is_local_keycloak_id(app_user.keycloak_id):
        try:
            await _kc_reset_password(app_user.keycloak_id, data.new_password)
        except KeycloakSyncError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Keycloak Passwort-Reset fehlgeschlagen: {exc}",
            ) from exc

    app_user.set_password(data.new_password)
    await db.flush()
    return {"status": "ok", "message": f"Passwort für '{app_user.username}' wurde zurückgesetzt."}


# ─── DELETE /users/{id} — Benutzer löschen ────────────────────────

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID, db: DB, user: CurrentUser):
    """Löscht einen Benutzer (nur Admin). Kann sich nicht selbst löschen."""
    _require_admin(user)
    app_user = await _get_user_or_404(db, user_id)

    # Selbstlöschung verhindern
    current_sub = user.get("sub", "")
    if str(app_user.keycloak_id) == current_sub or str(app_user.id) == current_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sie können sich nicht selbst löschen.",
        )

    if settings.keycloak_sync_users and not _is_local_keycloak_id(app_user.keycloak_id):
        try:
            await _kc_delete_user(app_user.keycloak_id)
        except KeycloakSyncError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Keycloak-Löschung fehlgeschlagen: {exc}",
            ) from exc

    await db.delete(app_user)
    await db.flush()


# ─── Hilfsfunktionen ──────────────────────────────────────────────

def _require_admin(user: dict) -> None:
    """Wirft 403 falls der Benutzer keine Admin-Rolle hat."""
    roles = user.get("realm_access", {}).get("roles", [])
    if "admin" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren dürfen Benutzer verwalten.",
        )


async def _get_user_or_404(db: AsyncSession, user_id: uuid.UUID) -> AppUser:
    """Gibt einen Benutzer zurück oder wirft 404."""
    result = await db.execute(select(AppUser).where(AppUser.id == user_id))
    app_user = result.scalar_one_or_none()
    if not app_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Benutzer mit ID '{user_id}' nicht gefunden.",
        )
    return app_user
