"""013 — RBAC-Permissions Tabelle + Standard-Berechtigungen.

Revision ID: 013_rbac_permissions
Revises: 012_medikament_katalog
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = "013_rbac_permissions"
down_revision = "012_medikament_katalog"
branch_labels = None
depends_on = None

# 4 Rollen
ROLES = ["arzt", "pflege", "fage", "admin"]

# Standard-Matrix
DEFAULT_MATRIX = {
    "Patientenstammdaten":   {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "RW"},
    "Vitalparameter":        {"arzt": "RW", "pflege": "RW", "fage": "RW", "admin": "R"},
    "Medikamente":           {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Medikamentengabe":      {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "R"},
    "Klinische Notizen":     {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Pflege-Dokumentation":  {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "R"},
    "Pflegediagnosen":       {"arzt": "R",  "pflege": "RW", "fage": "R",  "admin": "R"},
    "Aufenthalte":           {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "RW"},
    "Termine":               {"arzt": "RW", "pflege": "RW", "fage": "RW", "admin": "RW"},
    "Einwilligungen":        {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "RW"},
    "Patientenverfügungen":  {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "RW"},
    "Konsilien":             {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Arztbriefe":            {"arzt": "RW", "pflege": "R",  "fage": "\u2014",  "admin": "R"},
    "Laborwerte":            {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "I/O-Bilanz":            {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "R"},
    "Therapiepläne":         {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Hausbesuche":           {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "RW"},
    "Teleconsults":          {"arzt": "RW", "pflege": "R",  "fage": "\u2014",  "admin": "R"},
    "Remote-Geräte":         {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "RW"},
    "Selbstmedikation":      {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "R"},
    "Ernährung":             {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Verbrauchsmaterial":    {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "RW"},
    "Schichtübergabe":       {"arzt": "R",  "pflege": "RW", "fage": "RW", "admin": "R"},
    "Alarme":                {"arzt": "RW", "pflege": "RW", "fage": "R",  "admin": "RW"},
    "Diagnosen":             {"arzt": "RW", "pflege": "R",  "fage": "R",  "admin": "R"},
    "Audit-Trail":           {"arzt": "\u2014",  "pflege": "\u2014",  "fage": "\u2014",  "admin": "R"},
    "Benutzerverwaltung":    {"arzt": "\u2014",  "pflege": "\u2014",  "fage": "\u2014",  "admin": "RW"},
}


def upgrade() -> None:
    # Tabelle erstellen
    op.create_table(
        "rbac_permissions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("role", sa.String(30), nullable=False, index=True),
        sa.Column("resource", sa.String(100), nullable=False, index=True),
        sa.Column("access", sa.String(5), nullable=False, default="\u2014"),
        sa.Column("updated_by", sa.String(100), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("role", "resource", name="uq_rbac_role_resource"),
    )

    # Standard-Berechtigungen einfügen
    rbac_table = sa.table(
        "rbac_permissions",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("role", sa.String),
        sa.column("resource", sa.String),
        sa.column("access", sa.String),
        sa.column("updated_by", sa.String),
    )

    rows = []
    for resource, roles in DEFAULT_MATRIX.items():
        for role, access in roles.items():
            rows.append({
                "id": uuid.uuid4(),
                "role": role,
                "resource": resource,
                "access": access,
                "updated_by": "system",
            })

    op.bulk_insert(rbac_table, rows)


def downgrade() -> None:
    op.drop_table("rbac_permissions")
