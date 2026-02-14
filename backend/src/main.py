"""PDMS Home-Spital — FastAPI Application."""

import logging
import time
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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
from src.api.v1.messages import router as messages_router
from src.api.v1.nursing import router as nursing_router
from src.api.v1.patients import router as patients_router
from src.api.v1.providers import router as providers_router
from src.api.v1.users import router as users_router
from src.api.v1.vitals import router as vitals_router
from src.api.v1.home_visits import router as home_visits_router
from src.api.v1.teleconsults import router as teleconsults_router
from src.api.v1.remote_devices import router as remote_devices_router
from src.api.v1.self_medication import router as self_medication_router
from src.api.v1.lab_results import router as lab_results_router
from src.api.v1.fluid_balance import router as fluid_balance_router
from src.api.v1.treatment_plans import router as treatment_plans_router
from src.api.v1.consultations import router as consultations_router
from src.api.v1.medical_letters import router as medical_letters_router
from src.api.v1.nursing_diagnoses import router as nursing_diagnoses_router
from src.api.v1.shift_handovers import router as shift_handovers_router
from src.api.v1.nutrition import router as nutrition_router
from src.api.v1.supplies import router as supplies_router
from src.api.v1.diagnoses import router as diagnoses_router
from src.api.v1.icd10 import router as icd10_router
from src.api.v1.medikament_katalog import router as medikament_katalog_router
from src.api.v1.dossier import router as dossier_router
from src.api.v1.rbac import router as rbac_router
from src.api.v1.ai import router as ai_router
from src.api.v1.fhir import router as fhir_router
from src.api.websocket.alarms_ws import router as alarms_ws_router
from src.api.websocket.vitals_ws import router as vitals_ws_router
from src.config import get_media_root_path, settings
from src.infrastructure.rbac_guard import require_rbac

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
            binding_keys=["alarm.#", "medication.#", "encounter.#", "note.#", "nursing.#", "vital.#", "appointment.#", "consent.#", "home_visit.#", "teleconsult.#", "device.#", "self_medication.#", "lab.#", "fluid.#", "treatment_plan.#", "consultation.#", "letter.#", "shift_handover.#", "nutrition.#"],
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

# Media-Uploads (z. B. Patientenbilder)
media_root = get_media_root_path()
app.mount(settings.media_url_prefix, StaticFiles(directory=str(media_root)), name="media")

# Middleware (order matters: last added = first executed)
app.add_middleware(AuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Metrics Collection ──────────────────────────────────────────
_start_time = time.time()
_request_count: dict[str, int] = defaultdict(int)
_request_errors: dict[str, int] = defaultdict(int)
_request_duration: dict[str, float] = defaultdict(float)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next) -> Response:
    """Sammelt Request-Metriken (Anzahl, Fehler, Dauer)."""
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    method_path = f"{request.method} {request.url.path}"
    _request_count[method_path] += 1
    _request_duration[method_path] += duration
    if response.status_code >= 400:
        _request_errors[method_path] += 1
    return response


# ─── Health Check (erweiterter System-Status) ────────────────────
@app.get("/health", tags=["system"])
async def health():
    """Erweiterter Health-Check mit DB, Valkey, RabbitMQ Status."""
    from src.infrastructure.database import AsyncSessionLocal
    from src.infrastructure.valkey import valkey_health

    # Valkey
    try:
        vk = await valkey_health()
        valkey_status = "ok"
    except Exception:
        vk = {}
        valkey_status = "error"

    # Database
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    # RabbitMQ
    try:
        from src.infrastructure.rabbitmq import get_rabbitmq_connection
        conn = await get_rabbitmq_connection()
        rmq_status = "ok" if not conn.is_closed else "error"
    except Exception:
        rmq_status = "error"

    # Media-Storage (lokale Uploads)
    media_root_path = get_media_root_path()
    test_file = media_root_path / f".healthcheck-{uuid.uuid4().hex}.tmp"
    try:
        test_file.write_text("ok", encoding="utf-8")
        test_file.unlink(missing_ok=True)
        media_status = "ok"
        media_error: str | None = None
    except Exception as exc:
        media_status = "error"
        media_error = str(exc)

    # System
    uptime = time.time() - _start_time
    try:
        import psutil
        mem = psutil.virtual_memory()
        system_info = {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_used_mb": round(mem.used / 1024 / 1024, 1),
            "memory_total_mb": round(mem.total / 1024 / 1024, 1),
            "memory_percent": mem.percent,
        }
    except ImportError:
        import os
        system_info = {"pid": os.getpid()}

    overall = "ok" if all(s == "ok" for s in [valkey_status, db_status, rmq_status, media_status]) else "degraded"

    return {
        "status": overall,
        "service": "pdms-api",
        "version": app.version,
        "environment": settings.environment,
        "uptime_seconds": round(uptime, 1),
        "checks": {
            "database": db_status,
            "valkey": valkey_status,
            "rabbitmq": rmq_status,
            "media_storage": media_status,
        },
        "media": {
            "root_path": str(media_root_path),
            "url_prefix": settings.media_url_prefix,
            "writable": media_status == "ok",
            "error": media_error,
        },
        "system": system_info,
        "valkey_info": vk,
    }


# ─── Metrics Endpoint ────────────────────────────────────────────
@app.get("/metrics", tags=["system"])
async def metrics():
    """Gibt API-Metriken im JSON-Format zurück."""
    total_requests = sum(_request_count.values())
    total_errors = sum(_request_errors.values())

    # Top-10 Endpoints nach Anzahl Requests
    top_endpoints = sorted(_request_count.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "uptime_seconds": round(time.time() - _start_time, 1),
        "total_requests": total_requests,
        "total_errors": total_errors,
        "error_rate": round(total_errors / max(total_requests, 1) * 100, 2),
        "top_endpoints": [
            {
                "endpoint": ep,
                "requests": cnt,
                "errors": _request_errors.get(ep, 0),
                "avg_duration_ms": round(_request_duration.get(ep, 0) / max(cnt, 1) * 1000, 2),
            }
            for ep, cnt in top_endpoints
        ],
    }


app.include_router(patients_router, prefix="/api/v1", tags=["patients"], dependencies=[require_rbac("Patientenstammdaten")])
app.include_router(vitals_router, prefix="/api/v1", tags=["vitals"], dependencies=[require_rbac("Vitalparameter")])
app.include_router(alarms_router, prefix="/api/v1", tags=["alarms"], dependencies=[require_rbac("Alarme")])
app.include_router(medications_router, prefix="/api/v1", tags=["medications"], dependencies=[require_rbac("Medikamente")])
app.include_router(nursing_router, prefix="/api/v1", tags=["nursing"], dependencies=[require_rbac("Pflege-Dokumentation")])
app.include_router(clinical_notes_router, prefix="/api/v1", tags=["clinical-notes"], dependencies=[require_rbac("Klinische Notizen")])
app.include_router(encounters_router, prefix="/api/v1", tags=["encounters"], dependencies=[require_rbac("Aufenthalte")])
app.include_router(appointments_router, prefix="/api/v1", tags=["appointments"], dependencies=[require_rbac("Termine")])
app.include_router(consents_router, prefix="/api/v1", tags=["consents"], dependencies=[require_rbac("Einwilligungen")])
app.include_router(directives_router, prefix="/api/v1", tags=["directives"], dependencies=[require_rbac("Patientenverfügungen")])
app.include_router(insurance_router, prefix="/api/v1", tags=["insurance"])
app.include_router(contacts_router, prefix="/api/v1", tags=["contacts"])
app.include_router(providers_router, prefix="/api/v1", tags=["providers"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(messages_router, prefix="/api/v1", tags=["messages"])
app.include_router(audit_router, prefix="/api/v1", tags=["audit"], dependencies=[require_rbac("Audit-Trail")])
app.include_router(home_visits_router, prefix="/api/v1", tags=["home-visits"], dependencies=[require_rbac("Hausbesuche")])
app.include_router(teleconsults_router, prefix="/api/v1", tags=["teleconsults"], dependencies=[require_rbac("Teleconsults")])
app.include_router(remote_devices_router, prefix="/api/v1", tags=["remote-devices"], dependencies=[require_rbac("Remote-Geräte")])
app.include_router(self_medication_router, prefix="/api/v1", tags=["self-medication"], dependencies=[require_rbac("Selbstmedikation")])
app.include_router(lab_results_router, prefix="/api/v1", tags=["lab-results"], dependencies=[require_rbac("Laborwerte")])
app.include_router(fluid_balance_router, prefix="/api/v1", tags=["fluid-balance"], dependencies=[require_rbac("I/O-Bilanz")])
app.include_router(treatment_plans_router, prefix="/api/v1", tags=["treatment-plans"], dependencies=[require_rbac("Therapiepläne")])
app.include_router(consultations_router, prefix="/api/v1", tags=["consultations"], dependencies=[require_rbac("Konsilien")])
app.include_router(medical_letters_router, prefix="/api/v1", tags=["medical-letters"], dependencies=[require_rbac("Arztbriefe")])
app.include_router(nursing_diagnoses_router, prefix="/api/v1", tags=["nursing-diagnoses"], dependencies=[require_rbac("Pflegediagnosen")])
app.include_router(shift_handovers_router, prefix="/api/v1", tags=["shift-handovers"], dependencies=[require_rbac("Schichtübergabe")])
app.include_router(nutrition_router, prefix="/api/v1", tags=["nutrition"], dependencies=[require_rbac("Ernährung")])
app.include_router(supplies_router, prefix="/api/v1", tags=["supplies"], dependencies=[require_rbac("Verbrauchsmaterial")])
app.include_router(diagnoses_router, prefix="/api/v1", tags=["diagnoses"], dependencies=[require_rbac("Diagnosen")])
app.include_router(icd10_router, prefix="/api/v1", tags=["icd10"])
app.include_router(medikament_katalog_router, prefix="/api/v1", tags=["medikament-katalog"])
app.include_router(dossier_router, prefix="/api/v1", tags=["dossier"])
app.include_router(rbac_router, prefix="/api/v1", tags=["rbac"])

# FHIR R4 (CH Core Profile)
app.include_router(fhir_router, prefix="/api/v1", tags=["fhir"])

# AI Orchestrator
app.include_router(ai_router)

# WebSocket routes
app.include_router(alarms_ws_router, tags=["websocket"])
app.include_router(vitals_ws_router, tags=["websocket"])
