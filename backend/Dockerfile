# ─────────────────────────────────────────────────────────────────
# PDMS Home-Spital — Backend (FastAPI) Multi-Stage Dockerfile
# Stages: deps → build → production
# Ziel: Minimales Image, Non-Root, keine Dev-Dependencies
# ─────────────────────────────────────────────────────────────────

# ═══ Stage 1: Dependencies ═══════════════════════════════════════
FROM python:3.12-slim AS deps

WORKDIR /app

# System-Abhängigkeiten für Kompilation (asyncpg, cryptography)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .

# Nur Produktions-Dependencies installieren (kein dev)
RUN pip install --no-cache-dir --prefix=/install .

# ═══ Stage 2: Production ═════════════════════════════════════════
FROM python:3.12-slim AS production

# Labels (OCI-Standard)
LABEL org.opencontainers.image.title="PDMS API" \
    org.opencontainers.image.description="PDMS Home-Spital FastAPI Backend" \
    org.opencontainers.image.vendor="PDMS Home-Spital" \
    org.opencontainers.image.version="0.1.0"

WORKDIR /app

# Laufzeit-Abhängigkeiten (curl für Healthcheck, libpq für asyncpg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove

# Python-Packages aus deps-Stage kopieren
COPY --from=deps /install /usr/local

# Non-Root User erstellen (IEC 62304 / nDSG Compliance)
RUN groupadd --gid 1001 pdms && \
    useradd --uid 1001 --gid pdms --shell /bin/false --create-home pdms

# Quellcode kopieren
COPY --chown=pdms:pdms src/ ./src/
COPY --chown=pdms:pdms alembic/ ./alembic/
COPY --chown=pdms:pdms alembic.ini .

# Als Non-Root ausführen
USER pdms

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

# Uvicorn mit Production-Settings (kein --reload, Worker nach CPU-Kerne)
CMD ["uvicorn", "src.main:app", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--workers", "2", \
    "--proxy-headers", \
    "--forwarded-allow-ips", "*", \
    "--access-log", \
    "--log-level", "info"]
