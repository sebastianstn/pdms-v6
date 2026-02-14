"""017 — insurance_companies Katalog für auswählbare Versicherer.

Revision ID: 017_insurance_companies_catalog
Revises: 016_patient_photos_table
"""

import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "017_insurance_companies_catalog"
down_revision = "016_patient_photos_table"
branch_labels = None
depends_on = None


DEFAULT_INSURERS = [
    "Aquilana",
    "Assura",
    "Atupri",
    "Avenir",
    "CONCORDIA",
    "CSS",
    "EGK",
    "Galenos",
    "Groupe Mutuel",
    "Helsana",
    "KLuG",
    "KPT",
    "Kolping",
    "Mutuel",
    "ÖKK",
    "Philos",
    "Sanitas",
    "SLKK",
    "Sodalis",
    "Sumiswalder",
    "SWICA",
    "Sympany",
    "Visana",
    "vita surselva",
    "Vivacare",
]


def upgrade() -> None:
    """Erstellt insurance_companies Tabelle und seeded Standardkatalog."""
    op.create_table(
        "insurance_companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("supports_basic", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("supports_semi_private", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("supports_private", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_insurance_companies_name"),
    )

    op.create_index("ix_insurance_companies_name", "insurance_companies", ["name"], unique=False)
    op.create_index("ix_insurance_companies_is_active", "insurance_companies", ["is_active"], unique=False)

    companies_table = sa.table(
        "insurance_companies",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String(length=255)),
        sa.column("is_active", sa.Boolean()),
        sa.column("supports_basic", sa.Boolean()),
        sa.column("supports_semi_private", sa.Boolean()),
        sa.column("supports_private", sa.Boolean()),
    )

    op.bulk_insert(
        companies_table,
        [
            {
                "id": uuid.uuid4(),
                "name": name,
                "is_active": True,
                "supports_basic": True,
                "supports_semi_private": True,
                "supports_private": True,
            }
            for name in DEFAULT_INSURERS
        ],
    )


def downgrade() -> None:
    """Entfernt insurance_companies Tabelle inkl. Indizes."""
    op.drop_index("ix_insurance_companies_is_active", table_name="insurance_companies")
    op.drop_index("ix_insurance_companies_name", table_name="insurance_companies")
    op.drop_table("insurance_companies")
