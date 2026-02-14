"""Alembic environment — async support for SQLAlchemy."""

import asyncio
import sys
from pathlib import Path
from logging.config import fileConfig

# Ensure the api root (parent of src/) is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from src.config import settings
from src.infrastructure.database import Base

# Import all models so Alembic can detect them
from src.domain.models.patient import Patient, Insurance, InsuranceCompany, EmergencyContact, MedicalProvider, PatientPhoto  # noqa: F401
from src.domain.models.clinical import VitalSign, Encounter, Alarm, Medication, MedicationAdministration, NursingEntry, NursingAssessment, ClinicalNote  # noqa: F401
from src.domain.models.system import AppUser, AuditLog, UserMessage  # noqa: F401
from src.domain.models.planning import Appointment, DischargeCriteria  # noqa: F401
from src.domain.models.legal import Consent, AdvanceDirective, PatientWishes, PalliativeCare, DeathNotification  # noqa: F401
from src.domain.models.home_spital import HomeVisit, Teleconsult, RemoteDevice, SelfMedicationLog  # noqa: F401
from src.domain.models.lab import LabResult  # noqa: F401
from src.domain.models.fluid_balance import FluidEntry  # noqa: F401
from src.domain.models.therapy import (  # noqa: F401
    TreatmentPlan, TreatmentPlanItem, Consultation, MedicalLetter,
    NursingDiagnosis, ShiftHandover, NutritionOrder, NutritionScreening,
    SupplyItem, SupplyUsage,
)

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
