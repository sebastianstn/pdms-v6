"""phase_3c_fluid_balance

Revision ID: c7d3a9e51f28
Revises: b4e2f8a31c07
Create Date: 2026-02-10 19:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = 'c7d3a9e51f28'
down_revision: Union[str, None] = 'b4e2f8a31c07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('fluid_entries',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', UUID(as_uuid=True), nullable=False),
        sa.Column('encounter_id', UUID(as_uuid=True), nullable=True),
        sa.Column('direction', sa.String(length=10), nullable=False),
        sa.Column('category', sa.String(length=30), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('volume_ml', sa.Float(), nullable=False),
        sa.Column('route', sa.String(length=30), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('recorded_by', UUID(as_uuid=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['encounter_id'], ['encounters.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_fluid_entries_patient_id'), 'fluid_entries', ['patient_id'], unique=False)
    op.create_index('ix_fluid_entries_patient_direction_time', 'fluid_entries', ['patient_id', 'direction', 'recorded_at'])


def downgrade() -> None:
    op.drop_index('ix_fluid_entries_patient_direction_time', table_name='fluid_entries')
    op.drop_index(op.f('ix_fluid_entries_patient_id'), table_name='fluid_entries')
    op.drop_table('fluid_entries')
