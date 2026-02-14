"""014 — Benutzer-Passwort-Hash Spalte hinzufügen.

Revision ID: 014_user_password_hash
Revises: 013_rbac_permissions

Hinweis: Ersetzt die frühere 014_user_mgmt Migration.
"""

from alembic import op
import sqlalchemy as sa

revision = "014_user_password_hash"
down_revision = "013_rbac_permissions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Fügt password_hash und Namens-Spalten zur app_users Tabelle hinzu (idempotent)."""
    # Spalten existieren möglicherweise bereits aus einer früheren Migration
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [c["name"] for c in inspector.get_columns("app_users")]

    if "password_hash" not in existing_columns:
        op.add_column("app_users", sa.Column("password_hash", sa.String(255), nullable=True))
    if "first_name" not in existing_columns:
        op.add_column("app_users", sa.Column("first_name", sa.String(100), nullable=True))
    if "last_name" not in existing_columns:
        op.add_column("app_users", sa.Column("last_name", sa.String(100), nullable=True))
    if "created_at" not in existing_columns:
        op.add_column(
            "app_users",
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )


def downgrade() -> None:
    """Entfernt password_hash und Namens-Spalten."""
    op.drop_column("app_users", "created_at")
    op.drop_column("app_users", "last_name")
    op.drop_column("app_users", "first_name")
    op.drop_column("app_users", "password_hash")
