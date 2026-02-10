"""phase_3c_lab_results

Revision ID: b4e2f8a31c07
Revises: 792a43a9750b
Create Date: 2026-02-10 18:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision: str = 'b4e2f8a31c07'
down_revision: Union[str, None] = '792a43a9750b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('lab_results',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', UUID(as_uuid=True), nullable=False),
        sa.Column('encounter_id', UUID(as_uuid=True), nullable=True),
        # Analyte identification
        sa.Column('analyte', sa.String(length=50), nullable=False),
        sa.Column('loinc_code', sa.String(length=20), nullable=True),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        # Value
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        # Reference range
        sa.Column('ref_min', sa.Float(), nullable=True),
        sa.Column('ref_max', sa.Float(), nullable=True),
        # Interpretation
        sa.Column('flag', sa.String(length=10), nullable=True),
        sa.Column('interpretation', sa.String(length=20), nullable=True),
        # Trend
        sa.Column('trend', sa.String(length=5), nullable=True),
        sa.Column('previous_value', sa.Float(), nullable=True),
        # Metadata
        sa.Column('category', sa.String(length=30), nullable=False, server_default='chemistry'),
        sa.Column('sample_type', sa.String(length=30), nullable=True),
        sa.Column('collected_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resulted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ordered_by', UUID(as_uuid=True), nullable=True),
        sa.Column('validated_by', UUID(as_uuid=True), nullable=True),
        sa.Column('order_number', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('extra', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        # Constraints
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['encounter_id'], ['encounters.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_lab_results_patient_id'), 'lab_results', ['patient_id'], unique=False)
    op.create_index(op.f('ix_lab_results_analyte'), 'lab_results', ['analyte'], unique=False)
    op.create_index(op.f('ix_lab_results_order_number'), 'lab_results', ['order_number'], unique=False)
    op.create_index('ix_lab_results_patient_analyte_time', 'lab_results', ['patient_id', 'analyte', 'resulted_at'])


def downgrade() -> None:
    op.drop_index('ix_lab_results_patient_analyte_time', table_name='lab_results')
    op.drop_index(op.f('ix_lab_results_order_number'), table_name='lab_results')
    op.drop_index(op.f('ix_lab_results_analyte'), table_name='lab_results')
    op.drop_index(op.f('ix_lab_results_patient_id'), table_name='lab_results')
    op.drop_table('lab_results')
