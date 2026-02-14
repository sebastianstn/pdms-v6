"""Keycloak Admin API Client für Benutzer-Synchronisierung."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx

from src.config import settings

logger = logging.getLogger("pdms.keycloak.admin")

_MANAGED_ROLES = {"arzt", "pflege", "fage", "admin"}


class KeycloakSyncError(RuntimeError):
    """Fehler bei der Keycloak-Synchronisierung."""


@dataclass(slots=True)
class KeycloakUserPayload:
    """Datenmodell für Keycloak-Benutzer-Payload."""

    username: str
    email: str
    first_name: str | None
    last_name: str | None
    enabled: bool

    def to_dict(self) -> dict[str, Any]:
        """Konvertiert das Dataclass-Objekt in Keycloak-JSON."""
        return {
            "username": self.username,
            "email": self.email,
            "firstName": self.first_name or "",
            "lastName": self.last_name or "",
            "enabled": self.enabled,
            "emailVerified": True,
        }


class KeycloakAdminClient:
    """Minimaler async Client für Keycloak Admin REST API."""

    def __init__(self) -> None:
        self._base = settings.keycloak_url.rstrip("/")
        self._realm = settings.keycloak_realm
        self._admin_realm = settings.keycloak_admin_realm
        self._username = settings.keycloak_admin_username
        self._password = settings.keycloak_admin_password
        self._token: str | None = None

    def _assert_credentials(self) -> None:
        """Prüft, ob Admin-Credentials konfiguriert sind."""
        if not self._username or not self._password:
            raise KeycloakSyncError(
                "Keycloak-Admin-Credentials fehlen. Setze KC_ADMIN_USERNAME und KC_ADMIN_PASSWORD."
            )

    async def _get_admin_token(self) -> str:
        """Holt ein Admin-Token über admin-cli/password grant."""
        self._assert_credentials()

        token_url = f"{self._base}/realms/{self._admin_realm}/protocol/openid-connect/token"
        data = {
            "client_id": "admin-cli",
            "grant_type": "password",
            "username": self._username,
            "password": self._password,
        }

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(token_url, data=data)

        if resp.status_code >= 400:
            raise KeycloakSyncError(f"Keycloak Admin-Token konnte nicht geholt werden ({resp.status_code}).")

        token = resp.json().get("access_token")
        if not token:
            raise KeycloakSyncError("Keycloak Admin-Token fehlt in Response.")
        self._token = token
        return token

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: Any = None,
        params: dict[str, str] | None = None,
    ) -> httpx.Response:
        """Sendet einen autorisierten Request an die Admin API."""
        token = self._token or await self._get_admin_token()
        url = f"{self._base}{path}"

        async with httpx.AsyncClient(timeout=12) as client:
            resp = await client.request(
                method,
                url,
                json=json,
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            )

            if resp.status_code == 401:
                token = await self._get_admin_token()
                resp = await client.request(
                    method,
                    url,
                    json=json,
                    params=params,
                    headers={"Authorization": f"Bearer {token}"},
                )

        return resp

    async def find_user_by_username(self, username: str) -> dict[str, Any] | None:
        """Sucht einen Benutzer per exaktem Username im Realm."""
        resp = await self._request(
            "GET",
            f"/admin/realms/{self._realm}/users",
            params={"username": username},
        )
        if resp.status_code >= 400:
            raise KeycloakSyncError(f"Keycloak User-Suche fehlgeschlagen ({resp.status_code}).")

        users = resp.json()
        for user in users:
            if user.get("username") == username:
                return user
        return None

    async def create_user(
        self,
        *,
        username: str,
        email: str,
        first_name: str | None,
        last_name: str | None,
        password: str,
        role: str,
        enabled: bool,
    ) -> str:
        """Erstellt Benutzer in Keycloak inkl. Passwort und Rolle."""
        payload = KeycloakUserPayload(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            enabled=enabled,
        )

        resp = await self._request("POST", f"/admin/realms/{self._realm}/users", json=payload.to_dict())
        if resp.status_code not in {201, 409}:
            raise KeycloakSyncError(f"Keycloak User-Erstellung fehlgeschlagen ({resp.status_code}).")

        user = await self.find_user_by_username(username)
        if not user:
            raise KeycloakSyncError("Keycloak User wurde erstellt, aber nicht gefunden.")

        user_id = user["id"]
        await self.set_password(user_id=user_id, new_password=password)
        await self.set_user_role(user_id=user_id, role=role)
        return user_id

    async def update_user(
        self,
        *,
        user_id: str,
        username: str,
        email: str,
        first_name: str | None,
        last_name: str | None,
        enabled: bool,
        role: str,
    ) -> None:
        """Aktualisiert Benutzerstammdaten und Rolle in Keycloak."""
        payload = KeycloakUserPayload(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            enabled=enabled,
        )
        resp = await self._request(
            "PUT",
            f"/admin/realms/{self._realm}/users/{user_id}",
            json=payload.to_dict(),
        )
        if resp.status_code >= 400:
            raise KeycloakSyncError(f"Keycloak User-Update fehlgeschlagen ({resp.status_code}).")

        await self.set_user_role(user_id=user_id, role=role)

    async def set_password(self, *, user_id: str, new_password: str) -> None:
        """Setzt das Passwort in Keycloak."""
        resp = await self._request(
            "PUT",
            f"/admin/realms/{self._realm}/users/{user_id}/reset-password",
            json={"type": "password", "value": new_password, "temporary": False},
        )
        if resp.status_code >= 400:
            raise KeycloakSyncError(f"Keycloak Passwort-Reset fehlgeschlagen ({resp.status_code}).")

    async def delete_user(self, *, user_id: str) -> None:
        """Löscht Benutzer aus Keycloak."""
        resp = await self._request("DELETE", f"/admin/realms/{self._realm}/users/{user_id}")
        if resp.status_code not in {204, 404}:
            raise KeycloakSyncError(f"Keycloak User-Löschen fehlgeschlagen ({resp.status_code}).")

    async def _get_role(self, role_name: str) -> dict[str, Any]:
        """Lädt eine Realm-Rolle per Name."""
        resp = await self._request("GET", f"/admin/realms/{self._realm}/roles/{role_name}")
        if resp.status_code == 404:
            raise KeycloakSyncError(f"Keycloak-Rolle '{role_name}' existiert nicht.")
        if resp.status_code >= 400:
            raise KeycloakSyncError(f"Keycloak-Rolle '{role_name}' konnte nicht geladen werden ({resp.status_code}).")
        return resp.json()

    async def set_user_role(self, *, user_id: str, role: str) -> None:
        """Setzt genau eine Primärrolle für den Benutzer."""
        target_role = await self._get_role(role)

        current_resp = await self._request(
            "GET",
            f"/admin/realms/{self._realm}/users/{user_id}/role-mappings/realm",
        )
        if current_resp.status_code >= 400:
            raise KeycloakSyncError(f"Aktuelle Keycloak-Rollen konnten nicht geladen werden ({current_resp.status_code}).")

        current_roles: list[dict[str, Any]] = current_resp.json()
        to_remove = [r for r in current_roles if r.get("name") in _MANAGED_ROLES and r.get("name") != role]

        if to_remove:
            remove_resp = await self._request(
                "DELETE",
                f"/admin/realms/{self._realm}/users/{user_id}/role-mappings/realm",
                json=to_remove,
            )
            if remove_resp.status_code >= 400:
                raise KeycloakSyncError(f"Keycloak-Rollen konnten nicht entfernt werden ({remove_resp.status_code}).")

        has_target = any(r.get("name") == role for r in current_roles)
        if not has_target:
            add_resp = await self._request(
                "POST",
                f"/admin/realms/{self._realm}/users/{user_id}/role-mappings/realm",
                json=[target_role],
            )
            if add_resp.status_code >= 400:
                raise KeycloakSyncError(f"Keycloak-Rolle konnte nicht zugewiesen werden ({add_resp.status_code}).")
