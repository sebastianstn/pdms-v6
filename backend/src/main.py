"""PDMS Home-Spital — FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.middleware import AuditMiddleware
from src.api.v1.alarms import router as alarms_router
from src.api.v1.appointments import router as appointments_router
from src.api.v1.audit import router as audit_router
from src.api.v1.clinical_notes import router as clinical_notes_router
from src.api.v1.consents import router as consents_router
from src.api.v1.contacts import router as contacts_router
from src.api.v1.directives import router as directives_router
from src.api.v1.encounters import router as encounters_router
from src.api.v1.insurance import router as insurance_router
from src.api.v1.medications import router as medications_router
from src.api.v1.nursing import router as nursing_router
from src.api.v1.patients import router as patients_router
from src.api.v1.providers import router as providers_router
from src.api.v1.users import router as users_router
from src.api.v1.vitals import router as vitals_router
from src.api.v1.home_visits import router as home_visits_router
from src.api.v1.teleconsults import router as teleconsults_router
from src.api.v1.remote_devices import router as remote_devices_router
from src.api.v1.self_medication import router as self_medication_router
from src.api.websocket.alarms_ws import router as alarms_ws_router
from src.api.websocket.vitals_ws import router as vitals_ws_router
from src.config import settings

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger("pdms")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    from src.infrastructure.rabbitmq import close_rabbitmq_connection, get_rabbitmq_connection, start_consumer
    from src.infrastructure.valkey import close_valkey, connect_valkey, valkey_health

    logger.info(f"🏥 PDMS API starting ({settings.environment})")

    # Valkey: establish connection pool
    try:
        await connect_valkey()
        health = await valkey_health()
        logger.info("🔑 Valkey connected (v%s)", health.get("version", "?"))
    except Exception as exc:
        logger.warning("🔑 Valkey startup failed (non-fatal): %s", exc)

    # RabbitMQ: establish connection + start consumer
    try:
        await get_rabbitmq_connection()
        # Import handlers to register them via @on_event decorators
        import src.domain.events.handlers  # noqa: F401
        await start_consumer(
            queue_name="pdms.notifications",
            binding_keys=["alarm.#", "medication.#", "encounter.#", "note.#", "nursing.#", "vital.#", "appointment.#", "consent.#", "home_visit.#", "teleconsult.#", "device.#", "self_medication.#"],
        )
        logger.info("🐇 RabbitMQ consumer started")
    except Exception as exc:
        logger.warning("🐇 RabbitMQ startup failed (non-fatal): %s", exc)

    yield

    # Shutdown
    await close_rabbitmq_connection()
    await close_valkey()
    logger.info("🏥 PDMS API shutting down")


app = FastAPI(
    title="PDMS Home-Spital API",
    description="Patient Data Management System — REST + FHIR + WebSocket",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middleware (order matters: last added = first executed)
app.add_middleware(AuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health", tags=["system"])
async def health():
    from src.infrastructure.valkey import valkey_health
    vk = await valkey_health()
    return {
        "status": "ok",
        "service": "pdms-api",
        "environment": settings.environment,
        "valkey": vk,
    }


app.include_router(patients_router, prefix="/api/v1", tags=["patients"])
app.include_router(vitals_router, prefix="/api/v1", tags=["vitals"])
app.include_router(alarms_router, prefix="/api/v1", tags=["alarms"])
app.include_router(medications_router, prefix="/api/v1", tags=["medications"])
app.include_router(nursing_router, prefix="/api/v1", tags=["nursing"])
app.include_router(clinical_notes_router, prefix="/api/v1", tags=["clinical-notes"])
app.include_router(encounters_router, prefix="/api/v1", tags=["encounters"])
app.include_router(appointments_router, prefix="/api/v1", tags=["appointments"])
app.include_router(consents_router, prefix="/api/v1", tags=["consents"])
app.include_router(directives_router, prefix="/api/v1", tags=["directives"])
app.include_router(insurance_router, prefix="/api/v1", tags=["insurance"])
app.include_router(contacts_router, prefix="/api/v1", tags=["contacts"])
app.include_router(providers_router, prefix="/api/v1", tags=["providers"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(audit_router, prefix="/api/v1", tags=["audit"])
app.include_router(home_visits_router, prefix="/api/v1", tags=["home-visits"])
app.include_router(teleconsults_router, prefix="/api/v1", tags=["teleconsults"])
app.include_router(remote_devices_router, prefix="/api/v1", tags=["remote-devices"])
app.include_router(self_medication_router, prefix="/api/v1", tags=["self-medication"])

# WebSocket routes
app.include_router(alarms_ws_router, tags=["websocket"])
app.include_router(vitals_ws_router, tags=["websocket"])
