# 🏥 PDMS Home-Spital

**Patient Data Management System** — Open-Source Schweizer PDMS für Home-Hospitalisierung.

## Tech Stack

| Layer | Technologie |
|-------|-------------|
| Frontend | Next.js 15 · React 19 · TypeScript · Tailwind CSS · shadcn/ui |
| Backend | FastAPI · Python 3.12 · SQLAlchemy 2.0 · Pydantic v2 |
| Datenbank | PostgreSQL 16 · TimescaleDB · pgAudit |
| Auth | Keycloak 24 · RBAC · SMART on FHIR Scopes |
| Messaging | RabbitMQ · Valkey 9 (Redis-Fork) |
| Proxy | Nginx 1.27 |
| Standards | FHIR R4 · HL7v2 · ICD-10 · LOINC · SNOMED CT |

## Quick Start

```bash
# 1. Repository klonen
git clone <repository-url>
cd pdms-home-spital

# 2. pnpm aktivieren
corepack enable

# 3. Dependencies installieren
pnpm install

# 4. Umgebungsvariablen
cp .env.example .env

# 5. Docker-Stack starten
cd docker && docker compose up -d && cd ..

# 6. DB-Migration
cd backend && alembic upgrade head && cd ..

# 7. Backend starten
cd backend && uvicorn src.main:app --reload &

# 8. Frontend starten
cd frontend && pnpm dev
```

## Production Deployment (Raspberry Pi)

- Anleitung: `docs/deploy-raspberry-pi.md`
- Produktions-Variablen: `.env.prod.example`

## Projekt-Struktur

```
pdms-home-spital/
├── backend/          → FastAPI Backend (Python 3.12)
├── frontend/         → Next.js 15 Frontend (React 19)
├── packages/
│   └── shared-types/ → Gemeinsame TypeScript-Typen
├── docker/           → Docker Compose + Configs
├── docs/             → Projekt-Dokumentation (IEC 62304)
└── .github/          → CI/CD Pipelines
```

## Services (Development)

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| API (Swagger) | 8000 | http://localhost:8000/docs |
| Keycloak | 8080 | http://localhost:8080 |
| RabbitMQ | 15672 | http://localhost:15672 |
| PostgreSQL | 5432 | — |
| Valkey | 6379 | — |
| Nginx | 80 | http://localhost |

## Compliance

- 🇨🇭 **nDSG** — Schweizer Datenschutzgesetz
- 🏥 **IEC 62304** — Software-Lebenszyklus für Medizinprodukte
- 📋 **ISO 14971** — Risikomanagement
- 🔗 **FHIR R4** — Interoperabilität (CH Core Profiles)
- 📁 **EPDG** — Elektronisches Patientendossier

## Lizenz

MIT

## Sicherer Git-Workflow (Commit + Sync)

Einmalig im Repo ausführen:

```bash
./scripts/setup-git-workflow.sh
```

Damit werden lokal gesetzt:

- `commit.template=.gitmessage.txt`
- `core.hooksPath=.githooks`
- `pull.rebase=true`
- `rebase.autoStash=true`

Enthaltene Schutzmechanismen:

- **pre-commit:** blockiert versehentliche Commits von `backend/uploads/` und `.env`-Dateien
- **pre-push:** führt schnelle Checks nur auf geänderten Dateien aus (`ruff` für geänderte `backend/src`-Dateien, `eslint` für geänderte `frontend/src`-Dateien)

Notfall-Bypass (sparsam verwenden):

- `SKIP_GIT_CHECKS=1 git commit ...`
- `SKIP_PREPUSH_TESTS=1 git push`
