# 🗺️ PDMS Home-Spital — Roadmap

> **Stand:** 10. Februar 2026
> **Aktueller Status:** ~40% implementiert — Phase 1 (Core Fix) abgeschlossen, Auth + Dashboard + VitalChart live
> **Ziel:** Lauffähiges PDMS für Schweizer Home-Hospitalisierung

---

## Legende

| Symbol | Bedeutung |
|--------|-----------|
| ✅ | Erledigt |
| 🔧 | In Arbeit |
| ⬜ | Offen |
| 🔴 | Blocker / Kritisch |

---

## Phase 1 — Core Fix (Auth + Routing + Dashboard)

> **Priorität:** 🔴 Kritisch — Ohne diese Phase ist das PDMS nicht benutzbar
> **Geschätzter Aufwand:** 3–5 Tage

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 1.1 | Keycloak Auth-Flow (PKCE) | Frontend | ✅ | `callback/page.tsx` Token-Exchange, Token-Refresh im AuthProvider, echtes Login/Logout |
| 1.2 | Patient-Routen reparieren | Frontend | ✅ | 6 Tab-Dateien in `page.tsx`-Ordner umstrukturiert, `/patients/page.tsx` erstellt |
| 1.3 | Dashboard verdrahten | Frontend | ✅ | Stat-Cards mit `usePatients`/`useAlarms`, Patientenliste + Alarm-Panel live |
| 1.4 | PatientBand laden | Frontend | ✅ | `usePatient(id)` Hook in `patient-band.tsx` mit Loading/Error-States |
| 1.5 | VitalChart mit Recharts | Frontend | ✅ | Recharts `LineChart` mit Multi-Parameter, Zeitraum-Wahl, Tooltip |
| 1.6 | Hooks in Pages verdrahten | Frontend | ✅ | Personalien-Seite + Kurve-Seite mit Patient-/Vitals-Hooks verdrahtet |
| 1.7 | Alembic upgrade head | Backend | ✅ | 8 Tabellen via Initial-Migration erstellt |
| 1.8 | TimescaleDB Hypertable | Backend | ✅ | `vital_signs` als Hypertable mit Composite PK `(id, recorded_at)` |
| 1.9 | AuditMiddleware aktivieren | Backend | ✅ | Middleware schreibt mutating Requests in `audit_logs` Tabelle |
| 1.10 | UI-Bibliothek (shadcn/ui) | Frontend | ✅ | Card, Badge, Button, Spinner in `components/ui/` erstellt |

**Ergebnis Phase 1:** Benutzer können sich einloggen, Patienten sehen/erstellen, Vitalwerte erfassen und als Chart anzeigen.

---

## Phase 2 — Klinische Features

> **Priorität:** Hoch — Kernfunktionen eines PDMS
> **Geschätzter Aufwand:** 5–8 Tage
> **Voraussetzung:** Phase 1 abgeschlossen

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 2.1 | Alarm-System | Backend | ⬜ | Threshold-Prüfung in `vital_service`, Alarm-CRUD Router, WebSocket-Push (`alarms_ws.py`) |
| 2.2 | Alarm-Frontend | Frontend | ⬜ | `useAlarms` Hook, Alarm-Panel im Dashboard, Echtzeit-Benachrichtigung via WebSocket |
| 2.3 | Medikamenten-Modul (Backend) | Backend | ⬜ | Model `Medication` + `MedicationAdmin`, Schema, Service, Router — CRUD + Verabreichungs-Tracking |
| 2.4 | Medikamenten-Modul (Frontend) | Frontend | ⬜ | `useMedications` Hook, Medikamenten-Tabelle, Verabreichungs-Formular |
| 2.5 | Pflege-Dokumentation (Backend) | Backend | ⬜ | Model `NursingEntry`, Schema, Service, Router — Pflege-Assessments (Barthel, Norton, etc.) |
| 2.6 | Pflege-Dokumentation (Frontend) | Frontend | ⬜ | `useNursing` Hook, Pflege-Tab mit Einträgen und Assessments |
| 2.7 | Klinische Notizen (Backend) | Backend | ⬜ | Model `ClinicalNote`, Schema, Service, Router — Arzt-Berichte, Verlaufsnotizen |
| 2.8 | Klinische Notizen (Frontend) | Frontend | ⬜ | `useNotes` Hook, Notizen-Editor im Arzt-Tab |
| 2.9 | Encounter-Management | Backend | ⬜ | Encounter-Router implementieren (Aufnahme, Entlassung, Status-Wechsel) |
| 2.10 | RabbitMQ Events aktivieren | Backend | ⬜ | `publish_event()` in Vital-/Alarm-Service aufrufen, Event-Consumer für Benachrichtigungen |
| 2.11 | Valkey Caching | Backend | ⬜ | Patient-Cache, Session-Cache, Alarm-State in Valkey |

**Ergebnis Phase 2:** Vollständiges klinisches Arbeiten — Vitaldaten mit Alarmierung, Medikamente, Pflege-Doku, Arzt-Notizen.

---

## Phase 3 — Planung & Rechtliches

> **Priorität:** Mittel — Wichtig für Vollständigkeit
> **Geschätzter Aufwand:** 4–6 Tage
> **Voraussetzung:** Phase 2 abgeschlossen

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 3.1 | Termin-Kalender (Backend) | Backend | ⬜ | Model `Appointment`, Schema, Service, Router — Arzt-/Pflege-Termine |
| 3.2 | Termin-Kalender (Frontend) | Frontend | ⬜ | `useAppointments` Hook, Kalender-Komponente im Termine-Tab |
| 3.3 | Einwilligungen (Backend) | Backend | ⬜ | Model `Consent`, Schema, Service, Router — Informierte Einwilligung mit Gültigkeitszeitraum |
| 3.4 | Einwilligungen (Frontend) | Frontend | ⬜ | `useConsents` Hook, Einwilligungs-Übersicht im Rechtliche-Tab |
| 3.5 | Patientenverfügungen (Backend) | Backend | ⬜ | Model `AdvanceDirective`, Schema, Service — Vorsorgeauftrag, Vorausverfügung |
| 3.6 | Patientenverfügungen (Frontend) | Frontend | ⬜ | `useDirectives` Hook, Anzeige im Rechtliche-Tab |
| 3.7 | Versicherungs-Management | Full-Stack | ⬜ | Versicherungs-Router Backend + `InsuranceCard`-Komponente Frontend implementieren |
| 3.8 | Kontakt-Management | Full-Stack | ⬜ | Notfallkontakte-Router + `ContactCard`-Komponente implementieren |
| 3.9 | Shared Types vervollständigen | Packages | ⬜ | `documentation.ts`, `legal.ts`, `planning.ts` implementieren |

**Ergebnis Phase 3:** Vollständige Patientenakte mit Terminen, Einwilligungen, Patientenverfügungen, Versicherungen.

---

## Phase 4 — Production-Ready

> **Priorität:** Hoch vor Go-Live
> **Geschätzter Aufwand:** 5–7 Tage
> **Voraussetzung:** Phase 1–3 funktional

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 4.1 | SSL/TLS | Infra | ⬜ | Let's Encrypt Zertifikate, nginx SSL-Block, HSTS, Security-Headers |
| 4.2 | Production-Dockerfiles | Infra | ⬜ | Multi-Stage API-Dockerfile, Next.js Production-Build, Non-Root-User, `.dockerignore` |
| 4.3 | `docker-compose.prod.yml` | Infra | ⬜ | Ressourcen-Limits, Restart-Policies, Logging-Driver, Secrets-Management |
| 4.4 | Tests schreiben (>80%) | Testing | ⬜ | Patient-CRUD, Vitals, RBAC, Auth-Mocking, Integration-Tests |
| 4.5 | E2E-Tests (Playwright) | Testing | ⬜ | Login-Flow, Patient-Workflow, Vitaldaten-Erfassung |
| 4.6 | i18n (de/fr/it/en) | Frontend | ⬜ | `i18next` konfigurieren, Übersetzungsdateien, Sprachauswahl |
| 4.7 | lucide-react Icons | Frontend | ⬜ | Emoji-Icons durch lucide-react ersetzen |
| 4.8 | Dark/Light Mode | Frontend | ⬜ | `ThemeProvider` implementieren |
| 4.9 | Deploy-Pipeline | CI/CD | ⬜ | Docker-Build → Registry → Deployment (GitHub Actions) |
| 4.10 | Monitoring | Infra | ⬜ | Prometheus + Grafana + Alerting (FastAPI Metrics, DB-Health) |
| 4.11 | Backup-Strategie | Infra | ⬜ | pg_dump Cronjob, Volume-Backup, Recovery-Test |
| 4.12 | Rate-Limiting | Backend | ⬜ | nginx Rate-Limiting oder FastAPI Middleware |
| 4.13 | Keycloak Token-Mapper | Auth | ⬜ | Rollen korrekt in JWT-Claims mappen, Session-Policies konfigurieren |

**Ergebnis Phase 4:** Produktionsreifes System mit Sicherheit, Tests, Monitoring und automatisiertem Deployment.

---

## Phase 5 — Interoperabilität & Compliance

> **Priorität:** Mittel-Langfristig
> **Geschätzter Aufwand:** 8–12 Tage
> **Voraussetzung:** Phase 4 abgeschlossen

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 5.1 | FHIR R4 Endpoints | Backend | ⬜ | CH Core Profiles (Patient, Observation, Encounter), FHIR Bundle-Support |
| 5.2 | HL7v2 Interface | Backend | ⬜ | ADT-Nachrichten (Aufnahme/Entlassung/Transfer), ORU (Befunde) |
| 5.3 | EPD-Anbindung (EPDG) | Backend | ⬜ | XDS.b Repository, IHE-Transaktionen, XUA-Token |
| 5.4 | IEC 62304 Dokumentation | Docs | ⬜ | Software-Anforderungen, Architektur-Design, Risikomanagement, Verifikation |
| 5.5 | nDSG / DSFA | Docs | ⬜ | Datenschutz-Folgenabschätzung, Verarbeitungsverzeichnis, TOMs |
| 5.6 | ISO 14971 Risikomanagement | Docs | ⬜ | Gefährdungsanalyse, Risikobeurteilung, Risikokontrollmassnahmen |
| 5.7 | SNOMED CT / LOINC Kodierung | Backend | ⬜ | Diagnosen (ICD-10), Laborwerte (LOINC), Prozeduren (CHOP) |

**Ergebnis Phase 5:** Schweizer regulatorische Konformität und Anbindung an das Gesundheits-Ökosystem.

---

## Übersicht: Was haben wir vs. was brauchen wir

```
IMPLEMENTIERT ████████████████░░░░░░░░░░░░░░░░  40%
├── ✅ Monorepo-Struktur (pnpm + Turborepo)
├── ✅ Docker-Stack (7 Container, alle healthy)
├── ✅ Patient CRUD (5 API-Endpoints + Service + Schema)
├── ✅ Vitaldaten (2 API-Endpoints + Zeitreihen)
├── ✅ Keycloak JWT-Validierung + RBAC
├── ✅ DB-Schema (8 Tabellen via Alembic + TimescaleDB Hypertable)
├── ✅ Frontend App-Shell (Sidebar, TopBar, Layouts)
├── ✅ API-Client + React Query Hooks (Patients, Vitals, Alarms)
├── ✅ Shared TypeScript Types (Patient, Clinical, Auth)
├── ✅ CI Pipeline (Lint + Test)
├── ✅ Keycloak Realm (3 Rollen, 2 Clients, Test-User)
├── ✅ Auth-Flow PKCE (Login → Callback → Token-Refresh)
├── ✅ Patient-Routing (6 Tabs + Patientenliste)
├── ✅ Dashboard mit Echtdaten (Stat-Cards, Patientenliste, Alarme)
├── ✅ VitalChart (Recharts LineChart, Multi-Parameter, Zeitraum)
├── ✅ UI-Bibliothek (Card, Badge, Button, Spinner)
├── ✅ AuditMiddleware (schreibt in DB)
└── ✅ PatientBand / Personalien / Kurve mit Live-Daten

FEHLT        ░░░░░░░░░░░░░░░░████████████████████  60%
├── ⬜ 10 Backend-Router (Medications, Alarms, ...)
├── ⬜ 8 Backend-Services (noch leer)
├── ⬜ 4 Frontend-Hooks (Nursing, Notes, Consents, Directives)
├── ⬜ 5 Komponenten-Ordner (Medications, Documentation, etc.)
├── ⬜ WebSocket (Stubs vorhanden)
├── ⬜ SSL/TLS, Monitoring, Backups
├── ⬜ Tests (nur 1 Health-Test)
├── ⬜ i18n, Dark Mode, Icons
├── ⬜ FHIR R4, HL7v2, EPD
└── ⬜ Compliance-Docs (IEC 62304, nDSG)
```

---

## Meilensteine

| Meilenstein | Phase | Kriterium |
|-------------|-------|-----------|
| **M1 — MVP Lauffähig** | Phase 1 | Login → Patientenliste → Patient-Detail → Vitaldaten-Chart |
| **M2 — Klinisch nutzbar** | Phase 2 | Alarme, Medikamente, Pflege-Doku, Notizen funktionieren |
| **M3 — Feature-Complete** | Phase 3 | Termine, Einwilligungen, Patientenverfügungen, Versicherungen |
| **M4 — Production-Ready** | Phase 4 | SSL, Tests >80%, Monitoring, CI/CD, i18n |
| **M5 — Zertifizierbar** | Phase 5 | FHIR R4, EPD-Anbindung, IEC 62304, nDSG-konform |

---

*Nächster Schritt: Phase 2 starten — Alarm-System, Medikamenten-Modul und Pflege-Dokumentation implementieren.*
