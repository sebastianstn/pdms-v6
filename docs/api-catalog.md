# API-Katalog — 60 Endpoints

Siehe die ausführliche Dokumentation in der Planungs-JSX-Datei.
Swagger UI verfügbar unter: http://localhost:8000/docs

## Basis-Endpoints (Phase 1)

| Methode | Pfad | Beschreibung | Rollen |
|---------|------|--------------|--------|
| GET | /health | Health Check | Public |
| GET | /api/v1/me | Aktueller Benutzer | Alle |
| GET | /api/v1/patients | Patientenliste | Alle |
| GET | /api/v1/patients/:id | Patient Detail | Alle |
| POST | /api/v1/patients | Patient anlegen | Arzt, Admin |
| PATCH | /api/v1/patients/:id | Patient ändern | Arzt, Admin |
| DELETE | /api/v1/patients/:id | Patient löschen (soft) | Admin |
| GET | /api/v1/patients/:pid/vitals | Vitaldaten | Alle |
| POST | /api/v1/vitals | Vitaldaten erfassen | Arzt, Pflege |
| GET | /api/v1/audit | Audit-Log | Admin |

## Weitere Endpoints (Phase 2-3)

Verordnungen, Pflege-Dokumentation, Termine, Einwilligungen, FHIR-Export, WebSocket-Streams.
