"""016 — patient_photos Tabelle für lokal gespeicherte Patientenbilder.

Revision ID: 016_patient_photos_table
Revises: 015_patient_photo_url
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "016_patient_photos_table"
down_revision = "015_patient_photo_url"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Erstellt patient_photos Tabelle inkl. Indizes."""
    op.create_table(
        "patient_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("media_url", sa.String(length=500), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False, server_default="image/webp"),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("uploaded_by", sa.String(length=255), nullable=True),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_patient_photos_patient_id", "patient_photos", ["patient_id"], unique=False)
    op.create_index("ix_patient_photos_is_current", "patient_photos", ["is_current"], unique=False)


def downgrade() -> None:
    """Entfernt patient_photos Tabelle inkl. Indizes."""
    op.drop_index("ix_patient_photos_is_current", table_name="patient_photos")
    op.drop_index("ix_patient_photos_patient_id", table_name="patient_photos")
    op.drop_table("patient_photos")
