"""RBAC-Permissions Service — Verwaltet Zugriffsberechtigungen."""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.rbac import RbacPermission

# Standardwerte für die Rollen
ROLES = ["arzt", "pflege", "fage", "admin", "readonly"]

RESOURCES = [
    "Patientenstammdaten",
    "Vitalparameter",
    "Medikamente",
    "Medikamentengabe",
    "Klinische Notizen",
    "Pflege-Dokumentation",
    "Pflegediagnosen",
    "Aufenthalte",
    "Termine",
    "Einwilligungen",
    "Patientenverfügungen",
    "Konsilien",
    "Arztbriefe",
    "Laborwerte",
    "I/O-Bilanz",
    "Therapiepläne",
    "Hausbesuche",
    "Teleconsults",
    "Remote-Geräte",
    "Selbstmedikation",
    "Ernährung",
    "Verbrauchsmaterial",
    "Schichtübergabe",
    "Alarme",
    "Diagnosen",
    "Audit-Trail",
    "Benutzerverwaltung",
]

# Standard-Defaults (wenn keine DB-Einträge vorhanden)
DEFAULT_MATRIX: dict[str, dict[str, str]] = {
    "Patientenstammdaten":   {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "RW"},
    "Vitalparameter":        {"arzt": "RW", "pflege": "RW", "fage": "RW", "admin": "R"},
    "Medikamente":           {"arzt": "RW", "pflege": "RW", "fage": "R",  "admin": "R"},
    "Medikamentengabe":      {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "R"},
    "Klinische Notizen":     {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Pflege-Dokumentation":  {"arzt": "RW", "pflege": "RW", "fage": "RW", "admin": "R", "readonly": "R"},
    "Pflegediagnosen":       {"arzt": "R",  "pflege": "RW", "fage": "R",  "admin": "R"},
    "Aufenthalte":           {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "RW"},
    "Termine":               {"arzt": "RW", "pflege": "RW", "fage": "RW", "admin": "RW"},
    "Einwilligungen":        {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "RW"},
    "Patientenverfügungen":  {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "RW"},
    "Konsilien":             {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Arztbriefe":            {"arzt": "RW", "pflege": "R",  "fage": "—",  "admin": "R"},
    "Laborwerte":            {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "I/O-Bilanz":            {"arzt": "RW", "pflege": "RW", "fage": "RW", "admin": "R"},
    "Therapiepläne":         {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Hausbesuche":           {"arzt": "RW", "pflege": "RW", "fage": "RW", "admin": "RW"},
    "Teleconsults":          {"arzt": "RW", "pflege": "R",  "fage": "—",  "admin": "R"},
    "Remote-Geräte":         {"arzt": "RW", "pflege": "RW", "fage": "RW", "admin": "RW"},
    "Selbstmedikation":      {"arzt": "RW", "pflege": "RW", "fage": "RW", "admin": "R"},
    "Ernährung":             {"arzt": "RW", "pflege": "RW", "fage": "R",  "admin": "R"},
    "Verbrauchsmaterial":    {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "RW"},
    "Schichtübergabe":       {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "R"},
    "Alarme":                {"arzt": "RW", "pflege": "RW", "fage": "R",  "admin": "RW"},
    "Diagnosen":             {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Audit-Trail":           {"arzt": "—",  "pflege": "—",  "fage": "—",  "admin": "R"},
    "Benutzerverwaltung":    {"arzt": "R",  "pflege": "R",  "fage": "—",  "admin": "RW"},
}


class RbacPermissionService:
    """Verwaltet RBAC-Zugriffsberechtigungen in der Datenbank."""

    @staticmethod
    async def get_matrix(db: AsyncSession) -> dict[str, dict[str, str]]:
        """Liefert die gesamte RBAC-Matrix als {resource: {role: access}}."""
        result = await db.execute(select(RbacPermission))
        permissions = result.scalars().all()

        # Baue Matrix aus Defaults und überschreibe mit DB-Werten
        matrix: dict[str, dict[str, str]] = {}
        for resource in RESOURCES:
            matrix[resource] = dict(DEFAULT_MATRIX.get(resource, {r: "—" for r in ROLES}))

        for perm in permissions:
            if perm.resource in matrix and perm.role in ROLES:
                matrix[perm.resource][perm.role] = perm.access

        return matrix

    @staticmethod
    async def update_permission(
        db: AsyncSession,
        role: str,
        resource: str,
        access: str,
        updated_by: str,
    ) -> RbacPermission:
        """Setzt die Berechtigung für eine Rolle/Ressource-Kombination."""
        # Bestehenden Eintrag suchen
        result = await db.execute(
            select(RbacPermission).where(
                RbacPermission.role == role,
                RbacPermission.resource == resource,
            )
        )
        perm = result.scalar_one_or_none()

        if perm:
            perm.access = access
            perm.updated_by = updated_by
            perm.updated_at = datetime.now(UTC)
        else:
            perm = RbacPermission(
                role=role,
                resource=resource,
                access=access,
                updated_by=updated_by,
            )
            db.add(perm)

        await db.flush()
        return perm

    @staticmethod
    async def seed_defaults(db: AsyncSession, updated_by: str = "system"):
        """Seedet die Standard-Berechtigungen in die DB (nur wenn leer)."""
        result = await db.execute(select(RbacPermission).limit(1))
        if result.scalar_one_or_none() is not None:
            return  # Bereits geseedet

        for resource, roles in DEFAULT_MATRIX.items():
            for role, access in roles.items():
                db.add(RbacPermission(
                    role=role,
                    resource=resource,
                    access=access,
                    updated_by=updated_by,
                ))
        await db.flush()
