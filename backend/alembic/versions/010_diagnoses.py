"""Medizinische Diagnosen (ICD-10) — Tabelle hinzufügen

Revision ID: 010_diagnoses
Revises: 009_phase3c_therapy
Create Date: 2026-02-14
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "010_diagnoses"
down_revision: Union[str, None] = "009_phase3c_therapy"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "diagnoses",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False, index=True),
        sa.Column("encounter_id", UUID(as_uuid=True), sa.ForeignKey("encounters.id"), nullable=True),
        sa.Column("icd_code", sa.String(20), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("diagnosis_type", sa.String(20), nullable=False, server_default="haupt"),
        sa.Column("severity", sa.String(20), nullable=True),
        sa.Column("body_site", sa.String(100), nullable=True),
        sa.Column("laterality", sa.String(20), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("onset_date", sa.Date, nullable=True),
        sa.Column("resolved_date", sa.Date, nullable=True),
        sa.Column("diagnosed_by", UUID(as_uuid=True), nullable=True),
        sa.Column("diagnosed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Index für häufige Abfragen
    op.create_index("ix_diagnoses_icd_code", "diagnoses", ["icd_code"])
    op.create_index("ix_diagnoses_status", "diagnoses", ["status"])


def downgrade() -> None:
    op.drop_index("ix_diagnoses_status", table_name="diagnoses")
    op.drop_index("ix_diagnoses_icd_code", table_name="diagnoses")
    op.drop_table("diagnoses")
