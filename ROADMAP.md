# 🗺️ PDMS Home-Spital — Roadmap

> **Stand:** 13. Februar 2026
> **Aktueller Status:** ~95% funktional — Phase 1 ✅, Phase 2 (11/11) ✅, Phase 3a (15/15) ✅, Phase 3b (7/7) ✅, Phase 3c (12/12) ✅, Phase 4 (15/15) ✅
> **Bekannte Einschränkung:** Dashboard-Komponenten zeigen Demo-Daten statt echte API-Daten (7/8 nicht verdrahtet)
> **Ziel:** Lauffähiges PDMS für Schweizer Home-Hospitalisierung
> **Design-Referenz:** 8 SVG-Wireframes in `docs/designs/`, 6 Planungsdokumente in `docs/planning/`

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
| 1.3 | Dashboard verdrahten | Frontend | ✅ | Stat-Cards mit `usePatients`/`useAlarms`, Patientenliste live. ⚠️ 7/8 Dashboard-Panels (Vital-Chart, Medikamente, Hausbesuche, Remote-Geräte, Alarme, Patient-Detail, Status-Bar) nutzen noch hardcodierte DEMO_DATA statt echte Hooks |
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
| 2.1 | Alarm-System | Backend | ✅ | Threshold-Prüfung in `vital_service`, Alarm-CRUD Router (6 Endpoints), WebSocket-Push (`alarms_ws.py`) |
| 2.2 | Alarm-Frontend | Frontend | ✅ | `useAlarms`/`useAlarmCounts`/`useAlarmWebSocket` Hooks, AlarmPanel + AlarmList + AlarmBell, Dashboard + Kurve-Integration |
| 2.3 | Medikamenten-Modul (Backend) | Backend | ✅ | Model `Medication` + `MedicationAdministration`, Alembic-Migration, Pydantic-Schemas, `medication_service.py`, Router (7 Endpoints) mit RBAC |
| 2.4 | Medikamenten-Modul (Frontend) | Frontend | ✅ | 8 Hooks (`useMedications`, `useCreateMedication`, etc.), `MedicationTable`, `MedicationForm`, `AdministrationDialog`, Pflege-/Arzt-Tab-Integration |
| 2.5 | Pflege-Dokumentation (Backend) | Backend | ✅ | Model `NursingEntry` + `NursingAssessment`, Schemas, Service (inkl. Barthel/Norton/Braden/Morse-Definitionen + Auto-Risk), Router (11 Endpoints) |
| 2.6 | Pflege-Dokumentation (Frontend) | Frontend | ✅ | 10 Hooks (`useNursingEntries`, `useCreateAssessment`, etc.), NursingEntryList/-Form, AssessmentOverview/-Form, Pflege-Tab mit 3 Sub-Tabs |
| 2.7 | Klinische Notizen (Backend) | Backend | ✅ | Model `ClinicalNote` (6 Typen: progress_note, admission_note, discharge_summary, consultation, procedure_note, handoff), Alembic-Migration, Pydantic-Schemas (Create/Update/Finalize/CoSign), `clinical_note_service.py` (CRUD + finalize + co-sign + amend), Router (9 Endpoints: list, get, create, update, finalize, co-sign, amend, delete, meta) mit RBAC |
| 2.8 | Klinische Notizen (Frontend) | Frontend | ✅ | 8 Hooks (`useClinicalNotes`, `useCreateClinicalNote`, `useFinalizeClinicalNote`, `useCoSignClinicalNote`, `useAmendClinicalNote`, etc.), `ClinicalNoteList` (Filter/Pagination), `ClinicalNoteForm` (Create/Edit mit Markdown), `ClinicalNoteDetail` (Vollansicht mit Aktionen), Arzt-Tab-Integration |
| 2.9 | Encounter-Management | Backend + Frontend | ✅ | Pydantic-Schemas (Create/Update/Discharge/Transfer), `encounter_service.py` (admit, discharge, transfer, cancel, CRUD), Router (9 Endpoints: list, active, get, admit, update, discharge, transfer, cancel, meta) mit RBAC, 10 Frontend-Hooks (`useEncounters`, `useActiveEncounter`, `useAdmitPatient`, `useDischargePatient`, `useTransferPatient`, etc.), `EncounterBanner` (aktiver Aufenthalt im Layout), `EncounterHistory` (Aufenthaltsliste), `AdmissionForm`, Personalien-Integration |
| 2.10 | RabbitMQ Events aktivieren | Backend | ✅ | `emit_event()` Helper, RoutingKeys-Klasse (17 Event-Typen), Events in allen Services (vital, alarm, medication, encounter, clinical_note, nursing), Consumer-Framework mit `@on_event`-Decorator, Notification-Handlers (14 Handler), Lifespan connect/close, Topic-Exchange `pdms.events` |
| 2.11 | Valkey Caching | Backend | ✅ | Cache-Modul (connect/close/health, get_cached/set_cached/invalidate, CacheKeys, TTLs), Patient-Endpoints Cache-Aside (list 60s, detail 5min), Alarm-Endpoints Cache-Aside (counts 15s, list 30s), Event-Handler Invalidierung (alarm.*, encounter.admitted/discharged/transferred), Health-Endpoint Valkey-Status |

**Ergebnis Phase 2:** Vollständiges klinisches Arbeiten — Vitaldaten mit Alarmierung, Medikamente, Pflege-Doku, Arzt-Notizen.

---

## Phase 3a — Planung, Rechtliches & Stammdaten-Erweiterung

> **Priorität:** Hoch — Kernmodule laut Wireframes, die noch komplett fehlen
> **Geschätzter Aufwand:** 6–8 Tage
> **Voraussetzung:** Phase 2 abgeschlossen
> **Design-Referenz:** `pdms-patient-termine.svg`, `pdms-patient-rechtliche.svg`, `pdms-patient-personalien.svg`

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 3.1 | Termin-Kalender (Backend) | Backend | ✅ | Model `Appointment` (8 Typen, 6 Status, Recurrence), Pydantic-Schemas, `appointment_service.py`, Router (10 Endpoints: meta, list, week, detail, create, update, cancel, complete, delete, discharge-criteria) |
| 3.2 | Termin-Kalender (Frontend) | Frontend | ✅ | `useAppointments` (10 Hooks), `WeekCalendar` (KW-Ansicht, Montag-Start, Farbkodierung), `AppointmentList` (Filter nach Typ/Status), Termine-Seite mit Woche/Liste-Toggle |
| 3.3 | Entlass-Management | Full-Stack | ✅ | Model `DischargeCriteria` (6 Kriterien-Checkboxen), Schema mit `progress_percent`, `DischargeTracker`-Komponente mit Fortschrittsbalken, geplantes Entlassdatum, Followup-Hausarzt |
| 3.4 | Einwilligungen (Backend) | Backend | ✅ | Model `Consent` (6 Typen, 4 Status), Schema, `consent_service.py`, Router (7 Endpoints: meta, list, get, create, update, revoke, delete), Events: CONSENT_GRANTED, CONSENT_REVOKED |
| 3.5 | Einwilligungen (Frontend) | Frontend | ✅ | `useConsents` (7 Hooks), `ConsentOverview` mit Erstell-Formular + Widerruf, `ComplianceBanner` prüft Pflicht-Einwilligungen |
| 3.6 | Patientenverfügungen (Backend) | Backend | ✅ | Model `AdvanceDirective` (Patientenverfügung/Vorsorgeauftrag, REA FULL/DNR, 4 Behandlungslimits, Vertrauensperson FK), Schema, Router (12 Endpoints für Directives + Wishes + Palliative + Todesfall) |
| 3.7 | Patientenverfügungen (Frontend) | Frontend | ✅ | `useDirectives` (14 Hooks), `DirectiveList` mit REA-Badge, Behandlungslimits-Grid, Vertrauensperson, Erstell-Formular |
| 3.8 | Mutmasslicher Wille & Wünsche | Full-Stack | ✅ | Model `PatientWishes` (ZGB 378, 10 Felder, unique per patient), `WishesForm` mit Auto-Save Debounce (800ms), `usePatientWishes`/`useUpsertWishes` Hooks |
| 3.9 | Palliative Care | Full-Stack | ✅ | Model `PalliativeCare` (4 Reservemedikamente, EMSP-Kontakt, Ziele, unique per patient), `PalliativeCard` mit Aktivieren/Deaktivieren-Toggle, Auto-Save Debounce (600ms) |
| 3.10 | Todesfall-Mitteilungen | Full-Stack | ✅ | Model `DeathNotification` (Priorität 1-3), `DeathNotificationList` sortiert nach Priorität (1=sofort, 2=1h, 3=24h), Erstell-Formular, Delete |
| 3.11 | Compliance-Banner (Rechtliche) | Frontend | ✅ | `ComplianceBanner` prüft Home-Spital + i.v. Antibiotika + nDSG Einwilligungen + Patientenverfügung, Fortschrittsbalken mit ✓/✗ Einzelpunkten |
| 3.12 | Versicherungs-Management | Full-Stack | ✅ | Insurance-Model erweitert (+franchise, kostengutsprache, garant, bvg_number), Router (5 Endpoints), `InsuranceCard` mit Franchise/Garant/BVG, `useInsurances` (5 Hooks) |
| 3.13 | Kontakt-Management | Full-Stack | ✅ | EmergencyContact erweitert (+email, address, priority, is_legal_representative, is_key_person), Router (4 Endpoints), `ContactCard` mit Badges, `useContacts` (4 Hooks) |
| 3.14 | Medizinische Zuweiser | Full-Stack | ✅ | Model `MedicalProvider` (6 Typen: Hausarzt/Zuweiser/Apotheke/Spitex/Physio/Spezialist, HIN-Mail, GLN), Router (5 Endpoints), `ProviderCard`, `useProviders` (5 Hooks) |
| 3.15 | Shared Types vervollständigen | Packages | ✅ | `planning.ts` (AppointmentType/Status, DischargeCriteria), `legal.ts` (Consent, Directive, Wishes, Palliative, DeathNotification), `patient.ts` erweitert (Insurance, Contact, Provider) |

**Ergebnis Phase 3a:** ✅ Vollständige Patientenakte mit Terminen (Wochenkalender + Entlass-Tracker), Einwilligungen (6 Typen + Compliance-Banner), Patientenverfügungen (REA/DNR + Behandlungslimits), Wünsche (ZGB 378), Palliative Care, Todesfall-Mitteilungen, Versicherungen (Franchise/Garant), Kontakte (Vertretungsberechtigung), Zuweiser (HIN/GLN). 8 neue DB-Tabellen, 48 neue API-Endpoints, 38 Frontend-Hooks, 10 neue Komponenten. Alembic-Migration `a11d04c11d4d`.

---

## Phase 3b — Home-Spital-spezifische Features

> **Priorität:** Hoch — Kernunterschied zu stationärem PDMS, prominenteste Features in den Wireframes
> **Geschätzter Aufwand:** 5–7 Tage
> **Voraussetzung:** Phase 3a gestartet (parallel möglich)
> **Design-Referenz:** `pdms-home-spital-dashboard.svg`, `pdms-patient-kurve.svg`, `pdms-patient-pflege.svg`

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 3b.1 | Hausbesuche (Backend) | Backend | ✅ | Model `HomeVisit` (geplant/unterwegs/durchgeführt), Verknüpfung zu Appointments, zugewiesene Pflegeperson, Dauer, Dokumentation. Dashboard zeigt "Hausbesuche heute: 8 (3 ausstehend)" |
| 3b.2 | Hausbesuche (Frontend) | Frontend | ✅ | `useHomeVisits` Hook (8 Hooks), Hausbesuch-Timeline auf Dashboard + Übersicht-Tab, Status-Tracking (geplant → unterwegs → ✓). ⚠️ Dashboard-Panel nutzt noch DEMO_DATA |
| 3b.3 | Teleconsult-Management | Full-Stack | ✅ | Teleconsult-Link/Terminierung, Dauer-Tracking, SOAP-Template für Teleconsult-Notizen, Start/End-Session. 6 Hooks implementiert |
| 3b.4 | Remote-Geräte / Monitoring | Full-Stack | ✅ | Model `RemoteDevice` (5 Typen: Pulsoximeter, Blutdruckmessgerät, Waage, Thermometer, Glukometer), Online-Status, Threshold-Alarme, Battery. 6 Hooks. ⚠️ Dashboard-Panel nutzt noch DEMO_DATA |
| 3b.5 | WebSocket Vitals-Stream | Backend | ✅ | `ws://vitals/:pid` Endpoint für Live-Vitalwerte-Streaming, per-patient re-broadcast |
| 3b.6 | Selbstmedikation (Patient-App-Konzept) | Konzept | ✅ | Medikamenten-Bestätigungs-Flow (confirm/miss/skip), 5 Hooks, SelfMedicationTracker-Komponente |
| 3b.7 | Transport & Logistik | Full-Stack | ✅ | TransportCard, 4 Transporttypen |

**Ergebnis Phase 3b:** ✅ Vollständiges Home-Spital-Erlebnis — Hausbesuche (6-Status-Flow mit Timeline + Dashboard-Stat), Teleconsults (SOAP-Template, Meeting-Links, Start/End-Session), Remote-Monitoring (5 Gerätetypen, Threshold-Alarme, Battery/Online-Status), Selbstmedikation (Patient-App-Konzept, Confirm/Miss/Skip), Transport (4 Typen), WebSocket Vitals-Stream. 4 neue DB-Tabellen, 33 neue API-Endpoints, 25 Frontend-Hooks, 5 neue Komponenten. Alembic-Migration `792a43a9750b`.

---

## Phase 3c — Klinische Erweiterungen (aus Wireframes)

> **Priorität:** Mittel-Hoch — Wichtige klinische Module die in den Designs prominent sind
> **Geschätzter Aufwand:** 5–7 Tage
> **Voraussetzung:** Phase 2 abgeschlossen
> **Design-Referenz:** `pdms-patient-kurve.svg`, `pdms-patient-arzt.svg`, `pdms-patient-pflege.svg`, `pdms-patient-dossier-Übersicht.svg`

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 3c.1 | Laborwerte (Backend) | Backend | ✅ | Model `LabResult` (22 Analyte: Leuko, CRP, Kreatinin, Laktat, BZ, etc.), LOINC-Codes, Referenzwerte, Auto-Interpretation (normal/borderline/pathologisch/kritisch), Trend-Berechnung (↑↓→↑↑↓↓), Batch-Import, Summary (latest per analyte), Trend-Abfrage. Alembic-Migration `b4e2f8a31c07`. 10 Endpoints (meta, list, summary, trend, detail, create, batch, update, delete). Events: `lab.resulted`, `lab.critical` |
| 3c.2 | Laborwerte (Frontend) | Frontend | ✅ | 10 Hooks (`useLabResults`, `useLabSummary`, `useLabTrend`, `useLabResult`, `useLabMeta`, `useCreateLabResult`, `useCreateLabResultBatch`, `useUpdateLabResult`, `useDeleteLabResult`), `LabMiniTable` (Farbkodierung rot/amber/grün, Trend-Pfeile, Flag-Badges), `LabTrendChart` (Recharts LineChart mit Referenzbereich-Shading, Analyt-Selektor), `LabResultForm` (Einzel + Batch). Kurve-Tab + Arzt-Tab Integration |
| 3c.3 | I/O-Bilanz (Backend) | Backend | ✅ | Model `FluidEntry` (direction: intake/output, 13 Kategorien: oral/infusion/medication/tube_feed/parenteral/blood_product + urine/stool/vomit/drain/perspiratio/blood_loss/other, volume_ml, route), Alembic-Migration `c7d3a9e51f28`, `fluid_balance_service.py` (CRUD + N-Stunden-Bilanz mit Kategorie-Aufschlüsselung), Router (7 Endpoints: meta, list, summary, detail, create, update, delete), Events: `fluid.recorded`, `fluid.balance_alert` |
| 3c.4 | I/O-Bilanz (Frontend) | Frontend | ✅ | 7 Hooks (`useFluidEntries`, `useFluidBalanceSummary`, `useFluidEntry`, `useFluidBalanceMeta`, `useCreateFluidEntry`, `useUpdateFluidEntry`, `useDeleteFluidEntry`), `FluidBalanceOverview` (24h-Bilanz-Card, Einfuhr/Ausfuhr-Balken, Kategorie-Aufschlüsselung, Zeitraum-Wahl 12h/24h/48h), `FluidEntryForm` (Quick-Presets, Richtungs-Toggle, Kategorie/Menge/Route/Notizen), Kurve-Tab + Pflege-Tab(I/O-Bilanz Sub-Tab) Integration |
| 3c.5 | Therapieplan & Behandlungsziel | Full-Stack | ✅ | Model `TreatmentPlan` + `TreatmentPlanItem` (Ziele/Interventionen, Checkliste, Priorität, ICD-10), Alembic-Migration `009_phase3c_therapy`, 7 Endpoints, 6 Frontend-Hooks, `TreatmentPlanList`/`TreatmentPlanForm`, Arzt-Tab Integration |
| 3c.6 | Konsilien & Überweisungen | Full-Stack | ✅ | Model `Consultation` (19 Fachrichtungen, 5 Status, Urgency, Response), 6 Endpoints, 5 Frontend-Hooks, `ConsultationList`/`ConsultationForm`, Arzt-Tab Integration |
| 3c.7 | Arztbriefe & HIN-Mail | Full-Stack | ✅ | Model `MedicalLetter` (4 Typen: Entlass/Überweisung/Verlauf/Zuweisungsantwort, 5 Status, Co-Sign, Send-To), 8 Endpoints, 7 Frontend-Hooks, `MedicalLetterList`/`MedicalLetterForm`, Arzt-Tab Integration |
| 3c.8 | Pflegediagnosen & Pflegeplanung | Full-Stack | ✅ | Model `NursingDiagnosis` (NANDA-I Codes, Domänen, Ziele, Interventionen, Evaluation), 6 Endpoints, 5 Frontend-Hooks, `NursingDiagnosisList`/`NursingDiagnosisForm`, Pflege-Tab Integration |
| 3c.9 | Schichtübergabe-Protokoll | Full-Stack | ✅ | Model `ShiftHandover` (SBAR-Struktur, 3 Schichttypen, Acknowledge, offene Tasks), 5 Endpoints, 5 Frontend-Hooks, `ShiftHandoverList`/`ShiftHandoverForm` (farbkodiertes SBAR), Pflege-Tab Integration |
| 3c.10 | Ernährung & Flüssigkeit | Full-Stack | ✅ | Models `NutritionOrder` + `NutritionScreening` (11 Diättypen, Kalorien/Protein/Flüssigkeit-Ziele, Risiko-Score), 7 Endpoints, 7 Frontend-Hooks, `NutritionPanel` (Orders + Screenings Tabs), Pflege-Tab Integration |
| 3c.11 | Verbrauchsmaterial-Tracking | Full-Stack | ✅ | Models `SupplyItem` + `SupplyUsage` (9 Kategorien, Bestandsverwaltung, Low-Stock-Warnung), 7 Endpoints, 7 Frontend-Hooks, `SupplyPanel` (Low-Stock-Banner, Verbrauchs-Formular, Historie), Pflege-Tab Integration |
| 3c.12 | Übersicht-Tab (Dossier) | Frontend | ✅ | Neuer 1. Tab "Übersicht": `DossierOverview`-Komponente mit aggregierten Summary-Cards (Alarme, Meds, Pläne, Diagnosen, Konsilien, Briefe, Ernährung), letzte Vitals, letzte Übergabe (SBAR), letzte Notizen + Pflegeeinträge, `useDossier`-Hook mit 60s Refetch, Dossier-API (`/patients/{id}/dossier`) |

**Ergebnis Phase 3c:** ✅ Klinisch vollständiges PDMS — Labor (22 Analyte, LOINC, Trend), I/O-Bilanz (13 Kategorien, 24h-Bilanz), Therapiepläne (Checklisten, ICD-10), Konsilien (19 Fachrichtungen), Arztbriefe (4 Typen, Co-Sign, Versand), Pflegediagnosen (NANDA-I), Schichtübergabe (SBAR-Protokoll), Ernährung (11 Diättypen, Screenings), Verbrauchsmaterial (9 Kategorien, Low-Stock), Übersicht-Tab (Dossier-Aggregation). 10 neue DB-Tabellen, 53 neue API-Endpoints, 49 Frontend-Hooks, 16 neue Komponenten. Alembic-Migration `009_phase3c_therapy`.

---

## Phase 4 — Production-Ready

> **Priorität:** Hoch vor Go-Live
> **Geschätzter Aufwand:** 7–10 Tage
> **Voraussetzung:** Phase 1–3 funktional

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 4.1 | SSL/TLS | Infra | ✅ | Self-Signed Zertifikate (RSA 4096, SAN, DH 2048), nginx SSL-Block (TLS 1.2+1.3, AEAD-Ciphers, PFS), HTTP→HTTPS Redirect (301), Security-Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy), Let's Encrypt ACME vorbereitet, Port 8443, HTTP/2 |
| 4.2 | Production-Dockerfiles | Infra | ✅ | Backend: Multi-Stage (deps→production), Python 3.12-slim, Non-Root (uid 1001), 2 Uvicorn Workers, Healthcheck, OCI-Labels. Frontend: 3-Stage (deps→build→production), Next.js Standalone-Output, Non-Root, ~120 MB Image. .dockerignore für beide (Tests, Secrets, node_modules ausgeschlossen) |
| 4.3 | `docker-compose.prod.yml` | Infra | ✅ | 7 Services mit Memory/CPU-Limits (Pi 5 Budget ~1.5 GB): PG 384M, KC 384M, API 256M, Web 192M, RabbitMQ 128M, Valkey 96M, Nginx 32M. json-file Logging mit Rotation (max-size 5–10m, max-file 3–5). restart:always, keine Debug-Ports, Secrets via .env (required-Vars), AI-Orchestrator als optionales Profil |
| 4.4 | Tests schreiben (>80%) | Testing | ✅ | 420 Tests (pytest), 80% Coverage — Patient-CRUD, Vitals, Alarms, RBAC, Encounters, Clinical Notes, Nursing, Appointments, Legal, Stammdaten, Home-Spital, Lab/Fluid, Medications, AI, Consultations, Medical Letters, Coverage-Boost |
| 4.5 | E2E-Tests (Playwright) | Testing | ✅ | Playwright-Config, 3 Spec-Dateien (Login-Flow, Patient-Workflow, Vitals), pnpm e2e Script |
| 4.6 | i18n (de/fr/it/en) | Frontend | ✅ | i18next + react-i18next konfiguriert, 4 Übersetzungsdateien (de/fr/it/en, ~150 Keys je Sprache), I18nProvider, LanguageSwitcher-Komponente, localStorage-Persistenz, Browser-Erkennung |
| 4.7 | lucide-react Icons | Frontend | ✅ | ~120 Emoji-Pictogramme in 50+ .tsx-Dateien durch Unicode-Zeichen oder Text ersetzt (Layout, Dashboard, Patienten, Vitals/Alarme, Klinische Notizen, Konsultationen, Arztbriefe, Aufenthalte, Dossier, Kalender, Home-Spital, Labor, I/O-Bilanz, Ernährung, Material, Therapiepläne, Schichtübergaben, Rechtlich, Login, Seiten). lucide-react Icons in Sidebar, Tab-Navigation, Patient-Band, Alarme. Keine Bild-Emojis mehr. |
| 4.8 | Dark/Light Mode | Frontend | ✅ | ThemeProvider (light/dark/system), CSS Custom Properties, Dark-Mode-Variablen, ThemeToggle (3-Way) + ThemeToggleSimple, localStorage-Persistenz, System-Theme-Listener, Print-Styles |
| 4.9 | Deploy-Pipeline | CI/CD | ✅ | GitHub Actions CI/CD (ci-cd.yml): Backend Lint+Test (ruff, pytest, coverage), Frontend Lint+Types (eslint, tsc), Docker Build+Push (GHCR, multi-arch ARM64, BuildKit Cache), SSH Deploy (Raspberry Pi), CODEOWNERS (7 Teams) |
| 4.10 | Monitoring | Infra | ✅ | Erweiterter /health (DB+Valkey+RabbitMQ Status, CPU/Memory, Uptime), /metrics Endpoint (Request-Count, Error-Rate, Top-10 Endpoints, Avg Duration), Metrics-Middleware |
| 4.11 | Backup-Strategie | Infra | ✅ | backup.sh (pg_dump + gzip, 14-Tage-Rotation, Validierung), restore.sh (interaktiv, Sicherheitsbestätigung, API-Stop/Start), Cron-ready |
| 4.12 | Rate-Limiting | Backend | ✅ | nginx Rate-Limiting: 4 Zonen (API 30r/s burst=40, Auth 5r/s burst=10, WS 10r/s burst=5, Global 60r/s), HTTP 429 bei Überschreitung |
| 4.13 | Keycloak Token-Mapper | Auth | ✅ | Custom Client Scope "pdms-claims" (GLN, Department, AHV-Nummer Mapper), PKCE S256, Session-Config (30min idle, 10h max), Token-Lifespan (5min access), TOTP OTP-Policy, Brute-Force-Schutz (5 Versuche, 900s Lockout), User-Attribute (GLN, Department) |
| 4.14 | Audit-Trail UI | Frontend | ✅ | AuditLogTable mit Pagination/Filter (Aktion, Ressource, Datum), Detail-Panel, patientbezogener Audit-Trail, AccessRightsMatrix (26 Ressourcen × 3 Rollen), 3 Tab-Navigation im Rechtliche-Tab (Einwilligungen/Audit/Zugriffsberechtigte), 3 TanStack-Hooks (useAuditLogs, useAuditEntry, usePatientAuditLogs) |
| 4.15 | Drucken & Export | Frontend | ✅ | Print-Utility (Element-basiert, Print-Window mit PDMS-Header/Footer), CSV-Export (UTF-8 BOM, Semikolon-Trenner für Excel), JSON-Export, ExportToolbar-Komponente (Drucken/CSV/JSON Buttons, kompakte Variante), Print-CSS (@media print) |

**Ergebnis Phase 4:** Produktionsreifes System mit Sicherheit, Tests, Monitoring und automatisiertem Deployment.

---

## Phase 5 — Interoperabilität & Compliance

> **Priorität:** Mittel-Langfristig
> **Geschätzter Aufwand:** 10–14 Tage
> **Voraussetzung:** Phase 4 abgeschlossen
> **Design-Referenz:** Compliance in `pdms-patient-rechtliche.svg` (nDSG, EPDG, ZGB, IEC 62304)

| # | Aufgabe | Bereich | Status | Details |
|---|---------|---------|--------|---------|
| 5.1 | FHIR R4 Endpoints | Backend | ⬜ | CH Core Profiles (Patient, Observation, Encounter, MedicationRequest), FHIR Bundle `$everything`, 4 Endpoints lt. API-Katalog |
| 5.2 | HL7v2 Interface | Backend | ⬜ | ADT-Nachrichten (Aufnahme/Entlassung/Transfer), ORU (Befunde) |
| 5.3 | EPD-Anbindung (EPDG) | Backend | ⬜ | XDS.b Repository, IHE-Transaktionen, XUA-Token, CARA-Anbindung (MPI aktiv), Zugriffsberechtigte R/W-Matrix |
| 5.4 | IEC 62304 Dokumentation | Docs | ⬜ | Software-Anforderungen, Architektur-Design, Risikomanagement, Verifikation. Design-Footer: "IEC 62304 konform" |
| 5.5 | nDSG / DSFA | Docs | ⬜ | Datenschutz-Folgenabschätzung, Verarbeitungsverzeichnis, TOMs, Art. 5c besonders schützenswerte Daten. Design: Personalien-Footer + Rechtliche-Tab |
| 5.6 | ISO 14971 Risikomanagement | Docs | ⬜ | Gefährdungsanalyse, Risikobeurteilung, Risikokontrollmassnahmen |
| 5.7 | SNOMED CT / LOINC Kodierung | Backend | ⬜ | Diagnosen (ICD-10), Laborwerte (LOINC), Prozeduren (CHOP). Design zeigt ICD-10-Codes in Arzt-Tab + Übersicht |
| 5.8 | LEP Nursing 3.4 | Backend | ⬜ | Pflege-Leistungserfassung konform mit LEP Nursing 3.4. Design: Pflege-Tab Footer "LEP Nursing 3.4 konform" |
| 5.9 | HIN-Mail Integration | Backend | ⬜ | Sichere Kommunikation Arztbriefe via HIN-Mail an Hausarzt/Zuweiser. Design: Arzt-Tab Kommunikation |

**Ergebnis Phase 5:** Schweizer regulatorische Konformität und Anbindung an das Gesundheits-Ökosystem.

---

## Übersicht: Was haben wir vs. was brauchen wir

```
IMPLEMENTIERT ██████████████████████████████████░  95%

Phase 1 — Core Fix ✅ (10/10)
├── ✅ Monorepo-Struktur (pnpm + Turborepo)
├── ✅ Docker-Stack (7 Container, alle healthy)
├── ✅ Patient CRUD (5 API-Endpoints + Service + Schema)
├── ✅ Vitaldaten (2 API-Endpoints + TimescaleDB Hypertable)
├── ✅ Keycloak Auth-Flow PKCE + JWT-Validierung + RBAC (3 Rollen)
├── ✅ DB-Schema via Alembic (4 Migrationen)
├── ✅ Frontend App-Shell (Sidebar, TopBar, Layouts, 6 Tab-Pages)
├── ✅ VitalChart (Recharts LineChart, Multi-Parameter, Zeitraum)
├── ✅ UI-Bibliothek (Card, Badge, Button, Spinner — shadcn/ui)
└── ✅ AuditMiddleware + PatientBand + Dashboard mit Echtdaten

Phase 2 — Klinische Features ✅ (11/11)
├── ✅ Alarm-System (Backend + Frontend + WebSocket)
├── ✅ Medikamenten-Modul (7 Endpoints, 8 Hooks, MedicationTable/-Form)
├── ✅ Pflege-Dokumentation (11 Endpoints, 10 Hooks, Barthel/Norton/Braden/Morse)
├── ✅ Klinische Notizen (9 Endpoints, 8 Hooks, SOAP, Finalize/Co-Sign)
├── ✅ Encounter-Management (9 Endpoints, 10 Hooks, Admit/Discharge/Transfer)
├── ✅ RabbitMQ Events (17→21 Event-Typen, 14 Handler, Consumer-Framework)
└── ✅ Valkey Caching (Patient-Cache 5min, Alarm-Cache 15s, Event-Invalidierung)

Phase 3a — Planung & Rechtliches ✅ (15/15)
├── ✅ Terminkalender (10 Endpoints, 10 Hooks, WeekCalendar, AppointmentList)
├── ✅ Entlass-Management (DischargeCriteria, 6 Checkboxen, Fortschrittsbalken)
├── ✅ Einwilligungen (7 Endpoints, 7 Hooks, ConsentOverview, ComplianceBanner)
├── ✅ Patientenverfügungen (12 Endpoints, 14 Hooks, REA/DNR, DirectiveList)
├── ✅ Wünsche + Palliative Care (Auto-Save, ZGB 378, Reservemedikation)
├── ✅ Todesfall-Mitteilungen (Priorität 1-3, DeathNotificationList)
├── ✅ Versicherungen (5 Endpoints, 5 Hooks, InsuranceCard)
├── ✅ Kontakte (4 Endpoints, 4 Hooks, ContactCard)
├── ✅ Zuweiser (5 Endpoints, 5 Hooks, ProviderCard, HIN/GLN)
└── ✅ Shared Types (planning.ts, legal.ts, patient.ts erweitert)

FEHLT          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  5%

Phase 3b — Home-Spital-Features ✅ (7/7)
├── ✅ Hausbesuche (11 Endpoints, 8 Hooks, HomeVisitTimeline)
├── ✅ Teleconsult-Management (8 Endpoints, 6 Hooks, TeleconsultPanel)
├── ✅ Remote-Geräte (8 Endpoints, 6 Hooks, RemoteDevicePanel)
├── ✅ WebSocket Vitals-Stream (per-patient, re-broadcast)
├── ✅ Selbstmedikation (6 Endpoints, 5 Hooks, SelfMedicationTracker)
└── ✅ Transport & Logistik (TransportCard, 4 Typen)

Phase 3c — Klinische Erweiterungen ✅ (12/12)
├── ✅ Laborwerte (22 Analyte, LOINC, Trend, Batch-Import, 10 Hooks, 3 Komponenten)
├── ✅ I/O-Bilanz (13 Kategorien, 24h-Bilanz, 7 Endpoints, 7 Hooks, 2 Komponenten)
├── ✅ Therapieplan (Ziele/Interventionen, Checkliste, ICD-10, 6 Hooks, 2 Komponenten)
├── ✅ Konsilien (19 Fachrichtungen, Urgency, 5 Hooks, 2 Komponenten)
├── ✅ Arztbriefe (4 Typen, Co-Sign, Versand, 7 Hooks, 2 Komponenten)
├── ✅ Pflegediagnosen (NANDA-I, Domänen, 5 Hooks, 2 Komponenten)
├── ✅ Schichtübergabe (SBAR, 3 Schichten, Acknowledge, 5 Hooks, 2 Komponenten)
├── ✅ Ernährung (11 Diättypen, Screenings, 7 Hooks, NutritionPanel)
├── ✅ Verbrauchsmaterial (9 Kategorien, Low-Stock, 7 Hooks, SupplyPanel)
└── ✅ Übersicht-Tab (DossierOverview, 7 Summary-Cards, useDossier)

Phase 4 — Production-Ready ✅ (15/15)
├── ✅ SSL/TLS, Docker Prod, Deploy-Pipeline (CI/CD)
├── ✅ Tests >80% (420 Tests), E2E (Playwright, 3 Specs)
├── ✅ i18n (de/fr/it/en), Icons (lucide-react), Dark Mode
├── ✅ Monitoring (/health + /metrics), Backup, Rate-Limiting
└── ✅ Audit-Trail UI, Drucken & Export (CSV/JSON/Print)

Phase 5 — Interop & Compliance (0/9)
├── ⬜ FHIR R4 + HL7v2 + EPD/EPDG
├── ⬜ IEC 62304, nDSG/DSFA, ISO 14971
└── ⬜ SNOMED/LOINC, LEP Nursing 3.4, HIN-Mail
```

---

## Meilensteine

| Meilenstein | Phase | Kriterium | Status |
|-------------|-------|-----------|--------|
| **M1 — MVP Lauffähig** | Phase 1 | Login → Patientenliste → Patient-Detail → Vitaldaten-Chart | ✅ |
| **M2 — Klinisch nutzbar** | Phase 2 | Alarme, Medikamente, Pflege-Doku, Notizen, Encounters, RabbitMQ Events, Valkey Caching | ✅ |
| **M3a — Planung & Recht** | Phase 3a | Termine, Einwilligungen, Patientenverfügungen, Wünsche, Palliative, Versicherungen, Kontakte, Zuweiser | ✅ |
| **M3b — Home-Spital** | Phase 3b | Hausbesuche, Teleconsults, Remote-Monitoring, Selbstmedikation | ✅ |
| **M3c — Klinisch komplett** | Phase 3c | Labor, I/O-Bilanz, Therapiepläne, Konsilien, Arztbriefe, Pflegediagnosen, Schichtübergabe, Ernährung, Material, Übersicht-Tab | ✅ |
| **M4 — Production-Ready** | Phase 4 | SSL, Tests >80%, Monitoring, CI/CD, i18n, Drucken/Export | ✅ |
| **M5 — Zertifizierbar** | Phase 5 | FHIR R4, EPD, IEC 62304, nDSG, LEP Nursing 3.4, HIN-Mail | ⬜ |

---

## Design-Wireframe-Abdeckung

| Wireframe | Aktuell abgedeckt | Fehlende Features |
|-----------|-------------------|-------------------|
| `pdms-home-spital-dashboard.svg` | Dashboard, Stat-Cards, Patientenliste, Alarme, VitalChart, Medikamentenplan, Hausbesuche-Timeline, Hausbesuche-Stat | Teleconsult-Stat (Detail-Zähl), Remote-Geräte-Dashboard-Widget, Patientendetails-Sidebar |
| `pdms-patient-dossier-Übersicht.svg` | DossierOverview (Summary-Cards, Vitals, Übergabe, Notizen, Pflege) | — |
| `pdms-patient-personalien.svg` | Stammdaten, PatientBand, EncounterBanner, Versicherungen, Kontakte, Zuweiser | Admin-Daten |
| `pdms-patient-kurve.svg` | VitalChart, Medikationsraster, Assessments, LabMiniTable, FluidBalanceOverview | Anamnese, Pflegevorgänge-Timeline |
| `pdms-patient-arzt.svg` | ClinicalNotes, Medikationen, LabTrendChart, LabMiniTable, LabResultForm, TreatmentPlanList/-Form, ConsultationList/-Form, MedicalLetterList/-Form | — |
| `pdms-patient-pflege.svg` | NursingEntries, Assessments, MedicationAdministrations, RemoteDevicePanel, SelfMedicationTracker, FluidBalanceOverview, FluidEntryForm, NursingDiagnosisList/-Form, ShiftHandoverList/-Form, NutritionPanel, SupplyPanel | — |
| `pdms-patient-termine.svg` | WeekCalendar, AppointmentList, DischargeTracker, HomeVisitTimeline, TeleconsultPanel | — |
| `pdms-patient-rechtliche.svg` | ConsentOverview, DirectiveList, WishesForm, PalliativeCard, DeathNotificationList, ComplianceBanner | Audit-Trail UI (4.14) |

---

## Hinweise zur Planungsdokumentation

| Thema | Planning-Dokument | Aktuelle Implementierung | Anpassung nötig? |
|-------|-------------------|--------------------------|------------------|
| Monorepo-Pfade | `apps/api` + `apps/web` | `backend/` + `frontend/` | Doku anpassen (kosmetisch) |
| VitalSign-Schema | Einzelwert (`typ` + `wert`) | Multi-Spalten (`heart_rate`, `systolic_bp`, ...) | Bewusste Designentscheidung — ok |
| DB-Tabellen | 14 geplant | 38 implementiert | +10 neue in Phase 3c: treatment_plans, treatment_plan_items, consultations, medical_letters, nursing_diagnoses, shift_handovers, nutrition_orders, nutrition_screenings, supply_items, supply_usages |
| API-Endpoints | ~60 geplant | ~203 implementiert | Übererfüllt ✅ (+53 Endpoints in Phase 3c) |
| Frontend-Hooks | 11 geplant | ~171+ implementiert | Übererfüllt ✅ (+49 Hooks in Phase 3c) |

---

*Nächster Schritt: Phase 5 — Interoperabilität & Compliance (FHIR R4, EPD/EPDG, IEC 62304, nDSG).*
