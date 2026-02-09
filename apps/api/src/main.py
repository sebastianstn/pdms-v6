"""PDMS Home-Spital — FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.middleware import AuditMiddleware
from src.api.v1.audit import router as audit_router
from src.api.v1.patients import router as patients_router
from src.api.v1.users import router as users_router
from src.api.v1.vitals import router as vitals_router
from src.config import settings

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger("pdms")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info(f"🏥 PDMS API starting ({settings.environment})")
    yield
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
    return {"status": "ok", "service": "pdms-api", "environment": settings.environment}


app.include_router(patients_router, prefix="/api/v1", tags=["patients"])
app.include_router(vitals_router, prefix="/api/v1", tags=["vitals"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(audit_router, prefix="/api/v1", tags=["audit"])
