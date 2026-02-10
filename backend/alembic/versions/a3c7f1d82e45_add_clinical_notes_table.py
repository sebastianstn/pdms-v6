"""add_clinical_notes_table

Revision ID: a3c7f1d82e45
Revises: e97f8bcc46c6
Create Date: 2026-02-11 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a3c7f1d82e45'
down_revision: Union[str, None] = 'e97f8bcc46c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'clinical_notes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('encounter_id', sa.UUID(), nullable=True),
        sa.Column('note_type', sa.String(length=30), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('author_id', sa.UUID(), nullable=True),
        sa.Column('co_signed_by', sa.UUID(), nullable=True),
        sa.Column('co_signed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('is_confidential', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['encounter_id'], ['encounters.id']),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_clinical_notes_patient_id'), 'clinical_notes', ['patient_id'], unique=False)
    op.create_index('ix_clinical_notes_note_type', 'clinical_notes', ['note_type'], unique=False)
    op.create_index('ix_clinical_notes_status', 'clinical_notes', ['status'], unique=False)
    op.create_index('ix_clinical_notes_created_at', 'clinical_notes', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_clinical_notes_created_at', table_name='clinical_notes')
    op.drop_index('ix_clinical_notes_status', table_name='clinical_notes')
    op.drop_index('ix_clinical_notes_note_type', table_name='clinical_notes')
    op.drop_index(op.f('ix_clinical_notes_patient_id'), table_name='clinical_notes')
    op.drop_table('clinical_notes')
