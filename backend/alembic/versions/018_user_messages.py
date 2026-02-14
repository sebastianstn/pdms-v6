"""018 — user_messages Tabelle für interne Mitteilungszentrale.

Revision ID: 018_user_messages
Revises: 017_insurance_companies_catalog
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "018_user_messages"
down_revision = "017_insurance_companies_catalog"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Erstellt user_messages Tabelle inkl. Indizes."""
    op.create_table(
        "user_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recipient_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["sender_user_id"], ["app_users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipient_user_id"], ["app_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_user_messages_sender_user_id", "user_messages", ["sender_user_id"], unique=False)
    op.create_index("ix_user_messages_recipient_user_id", "user_messages", ["recipient_user_id"], unique=False)
    op.create_index("ix_user_messages_created_at", "user_messages", ["created_at"], unique=False)


def downgrade() -> None:
    """Entfernt user_messages Tabelle inkl. Indizes."""
    op.drop_index("ix_user_messages_created_at", table_name="user_messages")
    op.drop_index("ix_user_messages_recipient_user_id", table_name="user_messages")
    op.drop_index("ix_user_messages_sender_user_id", table_name="user_messages")
    op.drop_table("user_messages")
