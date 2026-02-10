import { useState } from "react";

// ─── TREE DATA ──────────────────────────────────────

const TREE = {
  name: "pdms-home-spital/",
  type: "root",
  desc: "Monorepo Root — pnpm Workspaces",
  children: [
    {
      name: "apps/",
      type: "dir",
      desc: "Deploybare Anwendungen",
      children: [
        {
          name: "web/",
          type: "app",
          tech: "Next.js 15 · React 19 · TypeScript",
          desc: "Frontend — Patient Data Management UI",
          children: [
            {
              name: "src/",
              type: "dir",
              desc: "Source Code",
              children: [
                {
                  name: "app/",
                  type: "dir",
                  desc: "Next.js App Router — Seitenstruktur",
                  children: [
                    { name: "layout.tsx", type: "file", tech: "React 19", desc: "Root Layout — Providers, Fonts, Metadata" },
                    { name: "page.tsx", type: "file", tech: "React 19", desc: "Startseite → Redirect zu /dashboard" },
                    { name: "(auth)/", type: "dir", desc: "Auth-Gruppe (ohne Sidebar)", children: [
                      { name: "login/page.tsx", type: "file", desc: "Keycloak Login Redirect" },
                      { name: "callback/page.tsx", type: "file", desc: "OAuth Callback Handler" },
                      { name: "logout/page.tsx", type: "file", desc: "Logout + Session Cleanup" },
                    ]},
                    { name: "(dashboard)/", type: "dir", desc: "Dashboard-Gruppe (mit Sidebar + PatientBand)", children: [
                      { name: "layout.tsx", type: "file", desc: "Dashboard Layout — AppSidebar + TopBar" },
                      { name: "dashboard/page.tsx", type: "file", tech: "TanStack Query", desc: "Patientenübersicht — Karten, Alarme, Statistiken" },
                      { name: "patients/", type: "dir", desc: "Patienten-Routen", children: [
                        { name: "[patientId]/", type: "dir", desc: "Dynamische Route pro Patient", children: [
                          { name: "layout.tsx", type: "file", tech: "nuqs", desc: "Patient-Layout — PatientBand + TabNavigation + nuqs State" },
                          { name: "personalien/page.tsx", type: "file", desc: "7 Karten: Stammdaten, Adresse, Versicherung, Kontakte..." },
                          { name: "kurve/page.tsx", type: "file", tech: "Recharts", desc: "Vitalkurve 24h + Medikamentengabe + Alarme" },
                          { name: "arzt/page.tsx", type: "file", desc: "Ärztl. Dokumentation — Verlauf, Diagnosen, Anordnungen" },
                          { name: "pflege/page.tsx", type: "file", desc: "Pflege-Schichtprotokoll — Assessment, Massnahmen" },
                          { name: "termine/page.tsx", type: "file", desc: "Wochenkalender — Visiten, Therapien, Labor" },
                          { name: "rechtliche/page.tsx", type: "file", desc: "PV, Vorsorgeauftrag, Einwilligungen, Palliativ" },
                        ]},
                      ]},
                    ]},
                  ],
                },
                {
                  name: "components/",
                  type: "dir",
                  desc: "React-Komponenten",
                  children: [
                    { name: "ui/", type: "dir", tech: "shadcn/ui", desc: "shadcn/ui Basis-Komponenten (Button, Card, Dialog, Table, ...)" },
                    { name: "layout/", type: "dir", desc: "Layout-Komponenten", children: [
                      { name: "app-sidebar.tsx", type: "file", desc: "Sidebar mit Navigation, Patientenliste, Logout" },
                      { name: "top-bar.tsx", type: "file", desc: "TopBar — Suche, Benachrichtigungen, User-Menü" },
                      { name: "patient-band.tsx", type: "file", desc: "Patient-Header: Name, AHV, Alter, Blutgruppe, EPD-Status" },
                      { name: "tab-navigation.tsx", type: "file", tech: "nuqs", desc: "6 Tabs (Personalien → Rechtliche) mit nuqs URL-Sync" },
                    ]},
                    { name: "patients/", type: "dir", desc: "Patienten-spezifische Komponenten", children: [
                      { name: "patient-card.tsx", type: "file", desc: "Patienten-Karte (Dashboard-Liste)" },
                      { name: "patient-form.tsx", type: "file", tech: "Zod v4", desc: "Stammdaten-Formular (Create/Edit) mit Zod-Validierung" },
                      { name: "insurance-card.tsx", type: "file", desc: "Versicherungs-Karte" },
                      { name: "contact-card.tsx", type: "file", desc: "Notfallkontakt-Karte" },
                    ]},
                    { name: "vitals/", type: "dir", desc: "Vitaldaten-Komponenten", children: [
                      { name: "vital-chart.tsx", type: "file", tech: "Recharts", desc: "Vitalkurve (Line/Area Chart) — 24h, 7d, 30d" },
                      { name: "vital-input.tsx", type: "file", desc: "Manuelle Vitaldaten-Erfassung" },
                      { name: "alarm-badge.tsx", type: "file", desc: "Alarm-Anzeige (kritisch/warnung/info)" },
                      { name: "alarm-bell.tsx", type: "file", desc: "Glocke mit Live-Counter (WebSocket)" },
                    ]},
                    { name: "medications/", type: "dir", desc: "Medikamenten-Komponenten", children: [
                      { name: "medication-plan.tsx", type: "file", desc: "Medikamentenplan-Tabelle (Morgen/Mittag/Abend/Nacht)" },
                      { name: "medication-form.tsx", type: "file", tech: "Zod v4", desc: "Verordnungs-Formular" },
                      { name: "admin-log.tsx", type: "file", desc: "Gabe-Dokumentation (Pflege)" },
                    ]},
                    { name: "documentation/", type: "dir", desc: "Dokumentations-Komponenten", children: [
                      { name: "note-editor.tsx", type: "file", desc: "Ärztl. Eintrag Editor (Markdown)" },
                      { name: "note-list.tsx", type: "file", desc: "Eintrags-Liste mit Filter (Verlauf/Diagnose/Anordnung)" },
                      { name: "nursing-entry.tsx", type: "file", desc: "Pflege-Eintrag Formular" },
                      { name: "nursing-handover.tsx", type: "file", desc: "Schicht-Übergabe Zusammenfassung" },
                    ]},
                    { name: "calendar/", type: "dir", desc: "Kalender-Komponenten", children: [
                      { name: "week-view.tsx", type: "file", desc: "Wochenansicht (Mo–So, Stunden-Raster)" },
                      { name: "appointment-card.tsx", type: "file", desc: "Termin-Karte (im Raster)" },
                      { name: "appointment-form.tsx", type: "file", tech: "Zod v4", desc: "Termin-Formular (Create/Edit)" },
                    ]},
                    { name: "legal/", type: "dir", desc: "Rechtliche Komponenten", children: [
                      { name: "consent-list.tsx", type: "file", desc: "Einwilligungsliste mit Status" },
                      { name: "consent-form.tsx", type: "file", desc: "Einwilligungs-Formular" },
                      { name: "directive-card.tsx", type: "file", desc: "Patientenverfügung-Karte (REA, Beatmung, Ernährung)" },
                      { name: "directive-form.tsx", type: "file", desc: "Verfügungs-Formular" },
                    ]},
                  ],
                },
                {
                  name: "hooks/",
                  type: "dir",
                  tech: "TanStack Query",
                  desc: "Custom Hooks — Data Fetching & State",
                  children: [
                    { name: "use-patients.ts", type: "file", desc: "usePatients(), usePatient(id), useCreatePatient()" },
                    { name: "use-vitals.ts", type: "file", desc: "useVitals(pid, range), useLatestVitals(pid)" },
                    { name: "use-medications.ts", type: "file", desc: "useMedications(pid), usePrescribe(), useAdminister()" },
                    { name: "use-notes.ts", type: "file", desc: "useNotes(pid), useCreateNote(), useReleaseNote()" },
                    { name: "use-nursing.ts", type: "file", desc: "useNursingEntries(pid), useHandover()" },
                    { name: "use-appointments.ts", type: "file", desc: "useAppointments(range), useCreateAppointment()" },
                    { name: "use-consents.ts", type: "file", desc: "useConsents(pid), useRevokeConsent()" },
                    { name: "use-directives.ts", type: "file", desc: "useDirectives(pid), useCreateDirective()" },
                    { name: "use-alarms.ts", type: "file", desc: "useAlarms(), useAckAlarm(), useAlarmStream() (WebSocket)" },
                    { name: "use-auth.ts", type: "file", desc: "useAuth(), useRole(), usePermission(resource)" },
                    { name: "use-audit.ts", type: "file", desc: "useAuditLog() — nur Admin" },
                  ],
                },
                {
                  name: "lib/",
                  type: "dir",
                  desc: "Utilities & Konfiguration",
                  children: [
                    { name: "api-client.ts", type: "file", tech: "fetch + Zod", desc: "Typsicherer API-Client (Base URL, Auth Headers, Error Handling)" },
                    { name: "auth.ts", type: "file", tech: "Keycloak", desc: "Keycloak OIDC Config, Token Management, PKCE" },
                    { name: "query-client.ts", type: "file", tech: "TanStack Query", desc: "QueryClient Konfiguration (staleTime, retry, devtools)" },
                    { name: "websocket.ts", type: "file", desc: "WebSocket Manager (Vitals + Alarms Stream)" },
                    { name: "permissions.ts", type: "file", desc: "RBAC Helper: canAccess(role, resource, action)" },
                    { name: "validators/", type: "dir", tech: "Zod v4", desc: "Zod-Schemas (spiegelbildlich zu Pydantic)", children: [
                      { name: "patient.ts", type: "file", desc: "PatientSchema, PatientCreateSchema, PatientUpdateSchema" },
                      { name: "vital.ts", type: "file", desc: "VitalSignSchema, VitalBatchSchema" },
                      { name: "medication.ts", type: "file", desc: "MedicationSchema, PrescribeSchema" },
                      { name: "appointment.ts", type: "file", desc: "AppointmentSchema, AppointmentCreateSchema" },
                      { name: "consent.ts", type: "file", desc: "ConsentSchema, DirectiveSchema" },
                    ]},
                    { name: "utils.ts", type: "file", desc: "Datum-Formatierung, AHV-Validierung, Farbhelper" },
                    { name: "constants.ts", type: "file", desc: "Enums, Status-Labels, Schicht-Zeiten" },
                  ],
                },
                {
                  name: "providers/",
                  type: "dir",
                  desc: "React Context Providers",
                  children: [
                    { name: "auth-provider.tsx", type: "file", desc: "Keycloak Auth Context + Token Refresh" },
                    { name: "query-provider.tsx", type: "file", desc: "TanStack QueryClientProvider + DevTools" },
                    { name: "theme-provider.tsx", type: "file", desc: "Light/Dark Mode (shadcn/ui)" },
                  ],
                },
                {
                  name: "styles/",
                  type: "dir",
                  desc: "Globale Styles",
                  children: [
                    { name: "globals.css", type: "file", tech: "Tailwind CSS", desc: "Tailwind Directives + CSS Variables (shadcn/ui Theme)" },
                  ],
                },
              ],
            },
            { name: "public/", type: "dir", desc: "Statische Assets (Logo, Favicon, Icons)" },
            { name: "next.config.ts", type: "file", tech: "Next.js 15", desc: "Next.js Config — Turbopack, Images, Rewrites" },
            { name: "tailwind.config.ts", type: "file", tech: "Tailwind CSS", desc: "Tailwind Config — PDMS Theme-Farben, Fonts" },
            { name: "tsconfig.json", type: "file", tech: "TypeScript", desc: "TypeScript Config (strict: true, paths: @/*)" },
            { name: "package.json", type: "file", desc: "Dependencies: react@19, next@15, @tanstack/react-query, zod, nuqs" },
          ],
        },
        {
          name: "api/",
          type: "app",
          tech: "FastAPI · Python 3.12 · DDD",
          desc: "Backend — REST + FHIR + WebSocket API",
          children: [
            {
              name: "src/",
              type: "dir",
              desc: "Source Code (DDD Struktur)",
              children: [
                {
                  name: "domain/",
                  type: "dir",
                  desc: "Domain Layer — Business-Logik, Entitäten",
                  children: [
                    { name: "models/", type: "dir", desc: "SQLAlchemy ORM Models", children: [
                      { name: "patient.py", type: "file", desc: "Patient, Insurance, EmergencyContact" },
                      { name: "clinical.py", type: "file", desc: "VitalSign, Medication, MedicationAdmin, Alarm" },
                      { name: "documentation.py", type: "file", desc: "ClinicalNote, NursingEntry" },
                      { name: "planning.py", type: "file", desc: "Appointment" },
                      { name: "legal.py", type: "file", desc: "Consent, AdvanceDirective" },
                      { name: "system.py", type: "file", desc: "AppUser, AuditLog" },
                    ]},
                    { name: "schemas/", type: "dir", tech: "Pydantic v2", desc: "Request/Response Schemas", children: [
                      { name: "patient.py", type: "file", desc: "PatientCreate, PatientUpdate, PatientResponse" },
                      { name: "vital.py", type: "file", desc: "VitalSignCreate, VitalBatch, VitalResponse" },
                      { name: "medication.py", type: "file", desc: "PrescribeRequest, AdministerRequest" },
                      { name: "note.py", type: "file", desc: "NoteCreate, NoteRelease, NursingCreate" },
                      { name: "appointment.py", type: "file", desc: "AppointmentCreate, AppointmentUpdate" },
                      { name: "legal.py", type: "file", desc: "ConsentCreate, DirectiveCreate" },
                      { name: "auth.py", type: "file", desc: "TokenPayload, UserResponse" },
                    ]},
                    { name: "services/", type: "dir", desc: "Business-Logik Services", children: [
                      { name: "patient_service.py", type: "file", desc: "CRUD + Status-Logik + FHIR-Mapping" },
                      { name: "vital_service.py", type: "file", desc: "Erfassung + Alarm-Auslösung + Aggregation" },
                      { name: "medication_service.py", type: "file", desc: "Verordnung + Gabe-Planung + Interaktionsprüfung" },
                      { name: "alarm_service.py", type: "file", desc: "Grenzwert-Check + Alarm-Erstellung + WebSocket-Push" },
                      { name: "note_service.py", type: "file", desc: "Erstellen + Freigeben + Gegenzeichnung" },
                      { name: "nursing_service.py", type: "file", desc: "Schicht-Einträge + Übergabe-Generator" },
                      { name: "appointment_service.py", type: "file", desc: "CRUD + Wiederholungslogik" },
                      { name: "consent_service.py", type: "file", desc: "Einwilligung + Widerruf + Verfügungen" },
                      { name: "fhir_service.py", type: "file", tech: "FHIR R4", desc: "Patient → FHIR Resource Mapping (CH Core)" },
                      { name: "audit_service.py", type: "file", desc: "App-Level Audit-Logging" },
                    ]},
                    { name: "events/", type: "dir", tech: "RabbitMQ", desc: "Domain Events", children: [
                      { name: "vital_events.py", type: "file", desc: "VitalRecorded, AlarmTriggered" },
                      { name: "medication_events.py", type: "file", desc: "MedicationPrescribed, MedicationAdministered" },
                      { name: "patient_events.py", type: "file", desc: "PatientAdmitted, PatientDischarged" },
                    ]},
                  ],
                },
                {
                  name: "api/",
                  type: "dir",
                  desc: "API Layer — FastAPI Router",
                  children: [
                    { name: "v1/", type: "dir", desc: "API Version 1", children: [
                      { name: "patients.py", type: "file", desc: "GET/POST/PUT/PATCH /patients" },
                      { name: "insurance.py", type: "file", desc: "CRUD /patients/:pid/insurance" },
                      { name: "contacts.py", type: "file", desc: "CRUD /patients/:pid/contacts" },
                      { name: "vitals.py", type: "file", desc: "GET/POST /patients/:pid/vitals + batch + trends" },
                      { name: "medications.py", type: "file", desc: "Verordnung + Gabe-Endpoints" },
                      { name: "alarms.py", type: "file", desc: "GET /alarms + ack + close" },
                      { name: "notes.py", type: "file", desc: "CRUD + release + cosign" },
                      { name: "nursing.py", type: "file", desc: "CRUD + handover" },
                      { name: "appointments.py", type: "file", desc: "CRUD + global calendar" },
                      { name: "consents.py", type: "file", desc: "CRUD + revoke" },
                      { name: "directives.py", type: "file", desc: "CRUD" },
                      { name: "users.py", type: "file", desc: "GET /me + sync" },
                      { name: "audit.py", type: "file", desc: "GET /audit (Admin only)" },
                      { name: "fhir.py", type: "file", desc: "FHIR R4 Export-Endpoints" },
                    ]},
                    { name: "websocket/", type: "dir", desc: "WebSocket Endpoints", children: [
                      { name: "vitals_ws.py", type: "file", desc: "WS /ws/vitals/:pid" },
                      { name: "alarms_ws.py", type: "file", desc: "WS /ws/alarms + /ws/alarms/:pid" },
                    ]},
                    { name: "dependencies.py", type: "file", desc: "FastAPI Dependencies (DB Session, Current User, RBAC)" },
                    { name: "middleware.py", type: "file", desc: "Audit-Middleware, CORS, Rate-Limiting" },
                  ],
                },
                {
                  name: "infrastructure/",
                  type: "dir",
                  desc: "Infrastructure Layer — DB, Auth, Messaging",
                  children: [
                    { name: "database.py", type: "file", tech: "SQLAlchemy 2.0", desc: "Engine, SessionLocal, Base" },
                    { name: "timescale.py", type: "file", tech: "TimescaleDB", desc: "Hypertable Setup + Aggregation Queries" },
                    { name: "keycloak.py", type: "file", tech: "Keycloak 24", desc: "JWT Validation, Token Decode, Role Extraction" },
                    { name: "rabbitmq.py", type: "file", tech: "RabbitMQ", desc: "Event Publisher + Consumer Setup" },
                    { name: "valkey.py", type: "file", tech: "Valkey 9", desc: "Cache Client (Session, Rate-Limit, Pub/Sub)" },
                    { name: "audit_db.py", type: "file", tech: "pgAudit", desc: "pgAudit Config + App-Level Trigger" },
                  ],
                },
                { name: "main.py", type: "file", tech: "FastAPI", desc: "App Factory — Router, Middleware, Lifespan Events" },
                { name: "config.py", type: "file", tech: "Pydantic Settings", desc: "Environment Config (.env → typed Settings)" },
              ],
            },
            { name: "alembic/", type: "dir", tech: "Alembic", desc: "DB-Migrationen (versions/, env.py, alembic.ini)" },
            { name: "tests/", type: "dir", tech: "pytest", desc: "Unit + Integration Tests", children: [
              { name: "conftest.py", type: "file", desc: "Fixtures: TestClient, DB Session, Auth Mock" },
              { name: "test_patients.py", type: "file", desc: "Patient CRUD Tests" },
              { name: "test_vitals.py", type: "file", desc: "Vitaldaten + TimescaleDB Tests" },
              { name: "test_rbac.py", type: "file", desc: "Berechtigungs-Tests (Arzt/Pflege/Admin)" },
            ]},
            { name: "pyproject.toml", type: "file", desc: "Dependencies: fastapi, sqlalchemy, pydantic, celery, alembic" },
            { name: "Dockerfile", type: "file", tech: "Docker", desc: "Multi-Stage Build (Python 3.12-slim)" },
          ],
        },
      ],
    },
    {
      name: "packages/",
      type: "dir",
      desc: "Shared Packages (zwischen Frontend & Backend)",
      children: [
        {
          name: "shared-types/",
          type: "dir",
          tech: "TypeScript",
          desc: "Gemeinsame TypeScript-Typen",
          children: [
            { name: "src/", type: "dir", desc: "Type Definitions", children: [
              { name: "patient.ts", type: "file", desc: "Patient, Insurance, EmergencyContact Types" },
              { name: "clinical.ts", type: "file", desc: "VitalSign, Medication, Alarm Types" },
              { name: "documentation.ts", type: "file", desc: "ClinicalNote, NursingEntry Types" },
              { name: "planning.ts", type: "file", desc: "Appointment Types" },
              { name: "legal.ts", type: "file", desc: "Consent, AdvanceDirective Types" },
              { name: "auth.ts", type: "file", desc: "User, Role, Permission Types" },
              { name: "api.ts", type: "file", desc: "ApiResponse<T>, PaginatedResponse<T>, ErrorResponse" },
              { name: "index.ts", type: "file", desc: "Re-exports aller Typen" },
            ]},
            { name: "package.json", type: "file", desc: "name: @pdms/shared-types" },
            { name: "tsconfig.json", type: "file", desc: "TypeScript Config" },
          ],
        },
      ],
    },
    {
      name: "docker/",
      type: "dir",
      tech: "Docker Compose",
      desc: "Docker-Konfigurationen",
      children: [
        { name: "docker-compose.yml", type: "file", desc: "Dev-Stack: PostgreSQL, Keycloak, RabbitMQ, Valkey, Nginx" },
        { name: "docker-compose.prod.yml", type: "file", desc: "Prod-Override: Volumes, Replicas, Secrets" },
        { name: "keycloak/", type: "dir", desc: "Keycloak Config", children: [
          { name: "realm-export.json", type: "file", desc: "PDMS Realm mit 3 Rollen, 2 Clients, MFA" },
          { name: "Dockerfile", type: "file", desc: "Keycloak 24 + CH Theme" },
        ]},
        { name: "nginx/", type: "dir", desc: "Reverse Proxy", children: [
          { name: "nginx.conf", type: "file", desc: "Routing: /api → FastAPI, / → Next.js, /auth → Keycloak" },
          { name: "ssl/", type: "dir", desc: "TLS-Zertifikate (dev: mkcert, prod: Let's Encrypt)" },
        ]},
        { name: "postgres/", type: "dir", desc: "PostgreSQL Init", children: [
          { name: "init.sql", type: "file", desc: "CREATE EXTENSION timescaledb, pgaudit; CREATE DATABASE pdms;" },
        ]},
      ],
    },
    {
      name: ".github/",
      type: "dir",
      tech: "GitHub Actions",
      desc: "CI/CD Pipeline (IEC 62304 konform)",
      children: [
        { name: "workflows/", type: "dir", desc: "GitHub Actions Workflows", children: [
          { name: "ci.yml", type: "file", desc: "Lint + Type-Check + Test (Web + API) bei jedem Push" },
          { name: "deploy.yml", type: "file", desc: "Build + Docker Push + Deploy (auf Tag/Release)" },
          { name: "visual-regression.yml", type: "file", desc: "SVG-Overlay Vergleich (Storybook → Screenshot → Diff)" },
        ]},
        { name: "CODEOWNERS", type: "file", desc: "Review-Pflicht für /api und /docker" },
      ],
    },
    {
      name: "docs/",
      type: "dir",
      desc: "Projekt-Dokumentation (IEC 62304)",
      children: [
        { name: "architecture.md", type: "file", desc: "6-Schichten Architektur-Übersicht" },
        { name: "api-catalog.md", type: "file", desc: "60 Endpoints dokumentiert" },
        { name: "rbac-matrix.md", type: "file", desc: "Berechtigungsmatrix (3 Rollen × 63 Ressourcen)" },
        { name: "database-schema.md", type: "file", desc: "14 Tabellen, ERD, SQL" },
        { name: "compliance/", type: "dir", desc: "Regulatorik", children: [
          { name: "ndsg-dsfa.md", type: "file", desc: "Datenschutz-Folgenabschätzung (nDSG Art. 22)" },
          { name: "iec-62304.md", type: "file", desc: "Software-Lebenszyklus Dokumentation" },
          { name: "epdg-integration.md", type: "file", desc: "EPD-Anbindung (CARA, FHIR R4)" },
        ]},
      ],
    },
    { name: "pnpm-workspace.yaml", type: "file", desc: "Workspace: apps/*, packages/*" },
    { name: ".env.example", type: "file", desc: "Alle Umgebungsvariablen (DB, Keycloak, RabbitMQ URLs)" },
    { name: ".gitignore", type: "file", desc: "node_modules, .next, __pycache__, .env" },
    { name: "turbo.json", type: "file", tech: "Turborepo", desc: "Build-Pipeline: lint → type-check → test → build" },
    { name: "README.md", type: "file", desc: "Projekt-Übersicht, Setup-Anleitung, Architektur" },
  ],
};

// ─── STATS ──────────────────────────────────────────

function countNodes(node) {
  let files = 0, dirs = 0;
  if (node.type === "file") files++;
  else dirs++;
  (node.children || []).forEach((c) => {
    const r = countNodes(c);
    files += r.files;
    dirs += r.dirs;
  });
  return { files, dirs };
}
const COUNTS = countNodes(TREE);

// ─── COMPONENTS ─────────────────────────────────────

const TYPE_ICONS = {
  root: "📁", dir: "📂", app: "🚀", file: "📄",
};

const TECH_COLORS = {
  "React 19": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Next.js 15": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "TypeScript": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "TanStack Query": "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "Zod v4": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "nuqs": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "shadcn/ui": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "Tailwind CSS": "bg-teal-500/20 text-teal-300 border-teal-500/30",
  "Recharts": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "FastAPI": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Python 3.12": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "SQLAlchemy 2.0": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Pydantic v2": "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "Pydantic Settings": "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "TimescaleDB": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Keycloak": "bg-red-500/20 text-red-300 border-red-500/30",
  "Keycloak 24": "bg-red-500/20 text-red-300 border-red-500/30",
  "RabbitMQ": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Valkey 9": "bg-red-500/20 text-red-300 border-red-500/30",
  "pgAudit": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "FHIR R4": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Docker": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Docker Compose": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "GitHub Actions": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "Alembic": "bg-green-500/20 text-green-300 border-green-500/30",
  "pytest": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Turborepo": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "fetch + Zod": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
};

function TreeNode({ node, depth = 0, defaultOpen = false }) {
  const hasChildren = node.children && node.children.length > 0;
  const [open, setOpen] = useState(depth < 2 || defaultOpen);
  const [hovered, setHovered] = useState(false);

  const indent = depth * 16;

  return (
    <div>
      <div
        className={`flex items-start gap-1.5 py-1 px-2 rounded-md transition-colors cursor-default ${
          hovered ? "bg-slate-800/80" : ""
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="w-4 h-5 flex items-center justify-center text-slate-500 hover:text-white flex-shrink-0 text-xs"
          >
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {/* Icon */}
        <span className="text-sm flex-shrink-0 leading-5">
          {node.type === "file"
            ? node.name.endsWith(".tsx") || node.name.endsWith(".ts")
              ? "⚛️"
              : node.name.endsWith(".py")
              ? "🐍"
              : node.name.endsWith(".yml") || node.name.endsWith(".yaml")
              ? "⚙️"
              : node.name.endsWith(".json")
              ? "📋"
              : node.name.endsWith(".md")
              ? "📝"
              : node.name.endsWith(".css")
              ? "🎨"
              : node.name === "Dockerfile"
              ? "🐳"
              : node.name.endsWith(".sql")
              ? "🗄️"
              : "📄"
            : node.type === "app"
            ? "🚀"
            : open
            ? "📂"
            : "📁"}
        </span>

        {/* Name */}
        <span className={`text-sm font-mono leading-5 ${
          node.type === "file" ? "text-slate-300" : node.type === "app" ? "text-cyan-400 font-bold" : "text-white font-bold"
        }`}>
          {node.name}
        </span>

        {/* Tech badges */}
        {node.tech && hovered && (
          <span className={`text-xs px-1.5 py-0 rounded border ml-1 flex-shrink-0 ${
            TECH_COLORS[node.tech?.split(" · ")[0]] || "bg-slate-500/20 text-slate-300 border-slate-500/30"
          }`}>
            {node.tech}
          </span>
        )}

        {/* Description */}
        {hovered && node.desc && (
          <span className="text-xs text-slate-500 ml-auto flex-shrink-0 max-w-xs truncate">{node.desc}</span>
        )}
      </div>

      {/* Children */}
      {hasChildren && open && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode key={child.name + i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function DependencyGraph() {
  const deps = [
    { from: "apps/web", to: "packages/shared-types", label: "importiert Types" },
    { from: "apps/web", to: "apps/api", label: "fetch() Requests" },
    { from: "apps/api", to: "PostgreSQL", label: "SQLAlchemy" },
    { from: "apps/api", to: "TimescaleDB", label: "Hypertable Queries" },
    { from: "apps/api", to: "Keycloak 24", label: "JWT Validation" },
    { from: "apps/api", to: "RabbitMQ", label: "Domain Events" },
    { from: "apps/api", to: "Valkey 9", label: "Cache + Pub/Sub" },
    { from: "apps/web", to: "Keycloak 24", label: "OIDC Login (PKCE)" },
    { from: "Nginx", to: "apps/web", label: "/ → :3000" },
    { from: "Nginx", to: "apps/api", label: "/api → :8000" },
    { from: "Nginx", to: "Keycloak 24", label: "/auth → :8080" },
  ];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="font-bold text-white text-sm mb-3">Dependency Graph</h3>
      <div className="space-y-1.5">
        {deps.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-cyan-400 font-mono text-xs bg-slate-800 rounded px-2 py-0.5 min-w-24 text-center">{d.from}</span>
            <span className="text-slate-600 text-xs">→</span>
            <span className="text-xs text-slate-500 italic flex-1">{d.label}</span>
            <span className="text-slate-600 text-xs">→</span>
            <span className="text-emerald-400 font-mono text-xs bg-slate-800 rounded px-2 py-0.5 min-w-24 text-center">{d.to}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickSetup() {
  const steps = [
    { cmd: "git clone <repo> && cd pdms-home-spital", desc: "Repository klonen" },
    { cmd: "corepack enable && pnpm install", desc: "pnpm aktivieren + Dependencies installieren" },
    { cmd: "cp .env.example .env", desc: "Umgebungsvariablen kopieren" },
    { cmd: "cd docker && docker compose up -d", desc: "PostgreSQL, Keycloak, RabbitMQ, Valkey starten" },
    { cmd: "cd apps/api && alembic upgrade head", desc: "Datenbank-Migrationen ausführen" },
    { cmd: "cd apps/api && uvicorn src.main:app --reload", desc: "FastAPI starten (Port 8000)" },
    { cmd: "cd apps/web && pnpm dev", desc: "Next.js starten (Port 3000)" },
    { cmd: "open http://localhost:3000", desc: "PDMS im Browser öffnen" },
  ];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="font-bold text-white text-sm mb-3">⚡ Quick Start (8 Befehle)</h3>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xs flex-shrink-0 mt-0.5">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <code className="text-xs text-cyan-300 bg-slate-950 px-2 py-0.5 rounded block overflow-x-auto">{s.cmd}</code>
              <span className="text-xs text-slate-500">{s.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────

export default function PDMSMonorepo() {
  const [tab, setTab] = useState("tree");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-8 rounded-full bg-cyan-500" />
            <div>
              <h1 className="text-lg font-black text-white">PDMS Monorepo-Struktur</h1>
              <p className="text-xs text-slate-500">pnpm Workspaces · Turborepo · {COUNTS.files} Dateien · {COUNTS.dirs} Ordner</p>
            </div>
            <div className="ml-auto flex gap-1.5">
              {["pnpm", "Turborepo", "Next.js 15", "FastAPI"].map((b) => (
                <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 hidden sm:inline-block">{b}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { id: "tree", label: "Verzeichnisbaum", icon: "🌳" },
              { id: "deps", label: "Dependencies", icon: "🔗" },
              { id: "setup", label: "Quick Start", icon: "⚡" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  tab === t.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="mr-1">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {[
            { n: COUNTS.files, l: "Dateien", c: "text-cyan-400" },
            { n: COUNTS.dirs, l: "Ordner", c: "text-emerald-400" },
            { n: "2", l: "Apps (Web + API)", c: "text-amber-400" },
            { n: "1", l: "Shared Package", c: "text-violet-400" },
            { n: "7", l: "Docker Services", c: "text-rose-400" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-center">
              <div className={`text-xl font-black ${s.c}`}>{s.n}</div>
              <div className="text-xs text-slate-500">{s.l}</div>
            </div>
          ))}
        </div>

        {tab === "tree" && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 py-2 overflow-x-auto">
            <div className="text-xs text-slate-600 px-4 py-1 border-b border-slate-800 mb-1">
              💡 Hover über eine Datei/Ordner → Beschreibung + Technologie anzeigen
            </div>
            <TreeNode node={TREE} depth={0} defaultOpen />
          </div>
        )}

        {tab === "deps" && <DependencyGraph />}
        {tab === "setup" && <QuickSetup />}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 text-center">
        <p className="text-xs text-slate-700">PDMS Home-Spital · Monorepo-Struktur v1.0 · pnpm + Turborepo · Stand Februar 2026</p>
      </div>
    </div>
  );
}
