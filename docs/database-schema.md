# Datenbankschema — 14 Tabellen

## Kern-Tabellen (Phase 1)

- **patients** — Stammdaten (AHV, Name, Adresse, Status)
- **encounters** — Aufenthalte/Fälle
- **vital_signs** — Vitaldaten (TimescaleDB Hypertable)
- **alarms** — Alarm-Events
- **insurances** — Versicherungsdaten
- **emergency_contacts** — Notfallkontakte
- **app_users** — Benutzer (synced mit Keycloak)
- **audit_logs** — Audit-Trail

## Erweiterte Tabellen (Phase 2-3)

- medications, medication_admins
- clinical_notes, nursing_entries
- appointments
- consents, advance_directives

Siehe SQLAlchemy Models in `apps/api/src/domain/models/`.
