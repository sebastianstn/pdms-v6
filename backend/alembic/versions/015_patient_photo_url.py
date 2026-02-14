"""015 — photo_url für Patientenbilder hinzufügen.

Revision ID: 015_patient_photo_url
Revises: 014_user_password_hash
"""

from alembic import op
import sqlalchemy as sa

revision = "015_patient_photo_url"
down_revision = "014_user_password_hash"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Fügt photo_url zu patients hinzu (idempotent)."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [c["name"] for c in inspector.get_columns("patients")]

    if "photo_url" not in existing_columns:
        op.add_column("patients", sa.Column("photo_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Entfernt photo_url aus patients."""
    op.drop_column("patients", "photo_url")
