"""Phase 3c — Therapieplan, Konsilien, Arztbriefe, Pflegediagnosen, Schichtübergabe, Ernährung, Verbrauchsmaterial

Revision ID: 009_phase3c_therapy
Revises: 008_fluid_balance
Create Date: 2026-02-12
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "009_phase3c_therapy"
down_revision: Union[str, None] = "c7d3a9e51f28"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── Therapieplan ──────────────────────────────────────
    op.create_table(
        "treatment_plans",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False, index=True),
        sa.Column("encounter_id", UUID(as_uuid=True), sa.ForeignKey("encounters.id"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("diagnosis", sa.Text, nullable=False),
        sa.Column("icd_code", sa.String(20), nullable=True),
        sa.Column("goals", sa.Text, nullable=False),
        sa.Column("interventions", sa.Text, nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("target_date", sa.Date, nullable=True),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("priority", sa.String(20), server_default="normal"),
        sa.Column("responsible_physician_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("review_date", sa.Date, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("extra", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "treatment_plan_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("plan_id", UUID(as_uuid=True), sa.ForeignKey("treatment_plans.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("item_type", sa.String(30), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("frequency", sa.String(100), nullable=True),
        sa.Column("duration", sa.String(100), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("sort_order", sa.Integer, server_default="0"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── Konsilien ─────────────────────────────────────────
    op.create_table(
        "consultations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False, index=True),
        sa.Column("encounter_id", UUID(as_uuid=True), sa.ForeignKey("encounters.id"), nullable=True),
        sa.Column("specialty", sa.String(100), nullable=False),
        sa.Column("urgency", sa.String(20), server_default="routine"),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("clinical_context", sa.Text, nullable=True),
        sa.Column("requested_by", UUID(as_uuid=True), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("consultant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("consultant_name", sa.String(200), nullable=True),
        sa.Column("response", sa.Text, nullable=True),
        sa.Column("recommendations", sa.Text, nullable=True),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), server_default="requested"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── Arztbriefe ────────────────────────────────────────
    op.create_table(
        "medical_letters",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False, index=True),
        sa.Column("encounter_id", UUID(as_uuid=True), sa.ForeignKey("encounters.id"), nullable=True),
        sa.Column("letter_type", sa.String(30), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("recipient_name", sa.String(200), nullable=True),
        sa.Column("recipient_institution", sa.String(255), nullable=True),
        sa.Column("recipient_email", sa.String(255), nullable=True),
        sa.Column("diagnosis", sa.Text, nullable=True),
        sa.Column("history", sa.Text, nullable=True),
        sa.Column("findings", sa.Text, nullable=True),
        sa.Column("therapy", sa.Text, nullable=True),
        sa.Column("procedures", sa.Text, nullable=True),
        sa.Column("recommendations", sa.Text, nullable=True),
        sa.Column("medication_on_discharge", sa.Text, nullable=True),
        sa.Column("follow_up", sa.Text, nullable=True),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("author_id", UUID(as_uuid=True), nullable=True),
        sa.Column("co_signed_by", UUID(as_uuid=True), nullable=True),
        sa.Column("co_signed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), server_default="draft"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_via", sa.String(30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── Pflegediagnosen ───────────────────────────────────
    op.create_table(
        "nursing_diagnoses",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False, index=True),
        sa.Column("encounter_id", UUID(as_uuid=True), sa.ForeignKey("encounters.id"), nullable=True),
        sa.Column("nanda_code", sa.String(20), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("domain", sa.String(100), nullable=True),
        sa.Column("defining_characteristics", sa.Text, nullable=True),
        sa.Column("related_factors", sa.Text, nullable=True),
        sa.Column("risk_factors", sa.Text, nullable=True),
        sa.Column("goals", sa.Text, nullable=True),
        sa.Column("interventions", sa.Text, nullable=True),
        sa.Column("evaluation", sa.Text, nullable=True),
        sa.Column("priority", sa.String(20), server_default="normal"),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("diagnosed_by", UUID(as_uuid=True), nullable=True),
        sa.Column("diagnosed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── Schichtübergabe ──────────────────────────────────
    op.create_table(
        "shift_handovers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False, index=True),
        sa.Column("encounter_id", UUID(as_uuid=True), sa.ForeignKey("encounters.id"), nullable=True),
        sa.Column("shift_type", sa.String(20), nullable=False),
        sa.Column("handover_date", sa.Date, nullable=False, index=True),
        sa.Column("situation", sa.Text, nullable=False),
        sa.Column("background", sa.Text, nullable=True),
        sa.Column("assessment", sa.Text, nullable=True),
        sa.Column("recommendation", sa.Text, nullable=True),
        sa.Column("open_tasks", JSONB, nullable=True),
        sa.Column("critical_info", sa.Text, nullable=True),
        sa.Column("handed_over_by", UUID(as_uuid=True), nullable=True),
        sa.Column("received_by", UUID(as_uuid=True), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── Ernährung ─────────────────────────────────────────
    op.create_table(
        "nutrition_orders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False, index=True),
        sa.Column("encounter_id", UUID(as_uuid=True), sa.ForeignKey("encounters.id"), nullable=True),
        sa.Column("diet_type", sa.String(50), nullable=False),
        sa.Column("texture", sa.String(30), nullable=True),
        sa.Column("supplements", sa.Text, nullable=True),
        sa.Column("restrictions", sa.Text, nullable=True),
        sa.Column("allergies", sa.Text, nullable=True),
        sa.Column("caloric_target", sa.Integer, nullable=True),
        sa.Column("protein_target", sa.Float, nullable=True),
        sa.Column("fluid_target", sa.Integer, nullable=True),
        sa.Column("special_instructions", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("ordered_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "nutrition_screenings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False, index=True),
        sa.Column("screening_type", sa.String(30), nullable=False),
        sa.Column("total_score", sa.Integer, nullable=False),
        sa.Column("risk_level", sa.String(20), nullable=False),
        sa.Column("items", JSONB, server_default="{}"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("screened_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("screened_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ─── Verbrauchsmaterial ────────────────────────────────
    op.create_table(
        "supply_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("article_number", sa.String(50), nullable=True, unique=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("unit", sa.String(20), nullable=False),
        sa.Column("stock_quantity", sa.Integer, server_default="0"),
        sa.Column("min_stock", sa.Integer, server_default="0"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "supply_usages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False, index=True),
        sa.Column("supply_item_id", UUID(as_uuid=True), sa.ForeignKey("supply_items.id"), nullable=False, index=True),
        sa.Column("encounter_id", UUID(as_uuid=True), sa.ForeignKey("encounters.id"), nullable=True),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("used_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("used_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("supply_usages")
    op.drop_table("supply_items")
    op.drop_table("nutrition_screenings")
    op.drop_table("nutrition_orders")
    op.drop_table("shift_handovers")
    op.drop_table("nursing_diagnoses")
    op.drop_table("medical_letters")
    op.drop_table("consultations")
    op.drop_table("treatment_plan_items")
    op.drop_table("treatment_plans")
