import { useState } from "react";

// ─── ICONS ───
const Lock = () => <span>🔒</span>;
const Shield = () => <span>🛡️</span>;
const Server = () => <span>🖥️</span>;
const DB = () => <span>🗄️</span>;
const Globe = () => <span>🌐</span>;
const Doc = () => <span>📋</span>;
const Alert = () => <span>🚨</span>;
const Check = () => <span className="text-emerald-500 font-bold">✓</span>;

// ─── FULL STACK DEFINITION ───
const STACK_LAYERS = [
  {
    id: "regulatory",
    name: "Regulatorik & Compliance",
    icon: "🏛️",
    color: "from-red-600 to-rose-700",
    accent: "red",
    desc: "Gesetzliche Grundlage — ohne diese Schicht ist alles andere wertlos",
    priority: "PFLICHT — Vor dem ersten Code",
    components: [
      {
        name: "IEC 62304:2006+A1:2015",
        role: "Software-Lebenszyklus für Medizinprodukte",
        detail: "Definiert den gesamten Entwicklungsprozess von Planung bis Wartung. PDMS = Klasse B oder C (Verletzung/Tod möglich bei Fehlfunktion). Erfordert: Software-Entwicklungsplan, Anforderungsspezifikation, Architektur-Design, Verifikation & Validierung, Risikomanagement-File, Konfigurationsmanagement.",
        impl: "Dokumentation parallel zur Entwicklung führen. Jedes Requirement muss zu Code und Tests rückverfolgbar sein (Traceability Matrix). Tool: Jama Software, Polarion oder Open-Source: Tuleap.",
        pflicht: true,
      },
      {
        name: "ISO 14971:2019",
        role: "Risikomanagement für Medizinprodukte",
        detail: "Systematische Identifikation, Bewertung und Kontrolle von Risiken. Für jede Software-Funktion: Was passiert bei Fehler? Wie wahrscheinlich? Wie schwer? Ergebnis: Risikomanagement-File mit Risikoanalyse, -bewertung, -kontrolle und Restrisiko-Akzeptanz.",
        impl: "FMEA (Failure Mode and Effects Analysis) für jede kritische Funktion. Risiko-Matrix erstellen. Regelmässig reviewen bei Änderungen.",
        pflicht: true,
      },
      {
        name: "EU MDR 2017/745 + CH-MepV",
        role: "Medizinprodukte-Verordnung (EU + Schweiz)",
        detail: "PDMS = Medizinprodukt Klasse IIa (Dokumentation) oder IIb (Therapieunterstützung, Alarme). Schweiz hat MRA mit EU → MDR gilt auch in CH via MepV. Erfordert: CE-Kennzeichnung, Konformitätsbewertung durch Benannte Stelle, technische Dokumentation nach Anhang II/III MDR.",
        impl: "Benannte Stelle frühzeitig kontaktieren (z.B. SQS, TÜV SÜD). Technische Dokumentation nach STED (Summary Technical Documentation) aufbauen.",
        pflicht: true,
      },
      {
        name: "nDSG (revDSG) — CH-Datenschutzgesetz",
        role: "Schweizer Datenschutz seit 01.09.2023",
        detail: "Gesundheitsdaten = besonders schützenswert (Art. 5 lit. c nDSG). Erfordert: Explizite Einwilligung, Datenschutz-Folgenabschätzung (DSFA), Privacy by Design & Default, Auskunfts-/Löschrechte, Meldepflicht bei Datenpannen (EDÖB), Verzeichnis der Bearbeitungstätigkeiten. Bussen bis CHF 250'000 (persönliche Haftung!).",
        impl: "DSFA vor Produktivbetrieb. Consent-Management in der App. Löschmechanismen implementieren. Datenbearbeitungsverzeichnis führen. Datenschutzberater benennen.",
        pflicht: true,
      },
      {
        name: "EPDG — Bundesgesetz über das elektronische Patientendossier",
        role: "Schweizer EPD-Gesetz + EPDV (Verordnung)",
        detail: "Spitäler müssen dem EPD angeschlossen sein. Dein PDMS muss Dokumente ins EPD exportieren können. Technisch: IHE-Profile (XDS.b, PIX, PDQ) über FHIR. Aktuell Revision des EPDG: künftig Opt-Out statt Opt-In, erweiterte Pflichten.",
        impl: "CH EPR FHIR Implementation Guide befolgen (fhir.ch). DocumentReference-Ressource für EPD-Export. IHE-Profile implementieren oder Gateway nutzen.",
        pflicht: true,
      },
      {
        name: "ISO 13485:2016",
        role: "Qualitätsmanagementsystem (QMS) für Medizinprodukte",
        detail: "Voraussetzung für IEC 62304. Definiert das gesamte QMS: Dokumentenlenkung, Design Controls, CAPA (Corrective and Preventive Actions), Lieferantenbewertung, interne Audits.",
        impl: "QMS aufsetzen (auch als Startup möglich). Minimal: Dokumentenlenkung, Change Control, Design History File. Tool: Greenlight Guru, MasterControl oder Notion/Confluence mit strukturierten Prozessen.",
        pflicht: true,
      },
    ],
  },
  {
    id: "frontend",
    name: "Frontend — Klinische UI",
    icon: "⚛️",
    color: "from-cyan-500 to-blue-600",
    accent: "cyan",
    desc: "React-basierte Benutzeroberfläche für Intensivstation und Stationen",
    priority: "Entwicklung ab Phase 2",
    components: [
      {
        name: "React 18+ mit TypeScript",
        role: "Haupt-Framework für die klinische UI",
        detail: "TypeScript ist Pflicht (nicht optional!) — Typsicherheit verhindert Fehler bei Medikamentendosen, Patientenverwechslung etc. Funktionale Komponenten mit Hooks. Strict Mode aktivieren.",
        impl: "npx create-react-app pdms --template typescript oder besser: Vite mit React-TS Template. ESLint + Prettier mit strikten Regeln. Keine 'any' Types erlaubt.",
        pflicht: true,
      },
      {
        name: "Next.js 14+ (App Router)",
        role: "Meta-Framework für SSR, Routing, API-Routes",
        detail: "Server-Side Rendering für schnellen initialen Load (kritisch bei Notfällen). App Router für verschachtelte Layouts (Station → Patient → Kurve). Middleware für Auth-Checks auf jeder Route. API-Routes als BFF (Backend for Frontend).",
        impl: "npx create-next-app@latest pdms-frontend --typescript --tailwind --app. Middleware.ts für Keycloak-Token-Validierung auf jeder Route.",
        pflicht: true,
      },
      {
        name: "TanStack Query (React Query)",
        role: "Server-State-Management & Caching",
        detail: "Automatische Refetch-Intervalle für Vitalparameter. Optimistic Updates für Medikamentenverabreichung. Stale-While-Revalidate für konsistente Daten auch bei kurzen Netzwerkunterbrechungen. Query Invalidation bei WebSocket-Events.",
        impl: "npm install @tanstack/react-query. QueryClient mit defaultOptions: staleTime für verschiedene Datentypen (Vitalzeichen: 5s, Stammdaten: 5min).",
        pflicht: true,
      },
      {
        name: "Recharts + D3.js",
        role: "Medizinische Datenvisualisierung",
        detail: "Patientenkurven (Vitalparameter über Zeit), Flüssigkeitsbilanz-Charts, Trend-Analyse. Recharts für Standard-Charts, D3 für spezialisierte medizinische Visualisierungen (EKG-ähnliche Kurven, Ventilator-Waveforms).",
        impl: "Recharts für 80% der Charts. Custom D3-Komponenten für Spezielles. Performance: Canvas-Rendering für >1000 Datenpunkte. Virtualisierung für lange Zeitreihen.",
        pflicht: true,
      },
      {
        name: "Workbox (PWA / Service Worker)",
        role: "Offline-Fähigkeit & Caching",
        detail: "Kritisch für Intensivstationen: Bei Netzwerkausfall muss Dokumentation weiterhin möglich sein. Service Worker cached kritische App-Shell und letzte Patientendaten. Sync-Queue für Offline-Eingaben.",
        impl: "next-pwa oder Workbox direkt. Cache-Strategie: Network-First für Vitaldaten, Cache-First für statische Assets. Background Sync API für Offline-Einträge.",
        pflicht: true,
      },
      {
        name: "Tailwind CSS + shadcn/ui",
        role: "Design-System & UI-Komponenten",
        detail: "Tailwind für konsistentes, wartbares Styling. shadcn/ui als Basis-Komponentenbibliothek (nicht MUI — zu schwer für klinische Performance). Eigenes Design-Token-System für klinische Farben (Alarm-Rot, Warnung-Gelb, Normal-Grün).",
        impl: "Design-Tokens definieren: --color-alarm, --color-warning, --color-normal. Alle klinischen Komponenten in eigenem /components/clinical/ Ordner. WCAG 2.1 AA Kontraste einhalten.",
        pflicht: true,
      },
      {
        name: "WebSocket Client (Socket.IO / native WS)",
        role: "Echtzeit-Datenstream vom Backend",
        detail: "Empfängt Vitalparameter-Updates, Alarme, Medikamenten-Erinnerungen in Echtzeit. Auto-Reconnect bei Verbindungsabbruch. Heartbeat-Monitoring der Verbindung.",
        impl: "Socket.IO Client oder native WebSocket mit Reconnect-Logic. Separate Channels pro Patient/Station. Alarm-Events haben höchste Priorität.",
        pflicht: true,
      },
      {
        name: "React-i18next",
        role: "Mehrsprachigkeit (DE, FR, IT, EN)",
        detail: "Schweiz hat 4 Landessprachen. Klinisches Personal muss in ihrer Sprache arbeiten können. Medizinische Terminologie muss korrekt übersetzt sein.",
        impl: "Namespace-basiert: common, clinical, medications, alerts. Professionelle medizinische Übersetzung (nicht Google Translate!).",
        pflicht: true,
      },
    ],
  },
  {
    id: "backend",
    name: "Backend — API & Business Logic",
    icon: "🐍",
    color: "from-green-500 to-emerald-600",
    accent: "green",
    desc: "FastAPI-basiertes Backend mit FHIR-Konformität und Echtzeit-Verarbeitung",
    priority: "Entwicklung ab Phase 2",
    components: [
      {
        name: "Python 3.12+ mit FastAPI",
        role: "REST- & FHIR-API Server",
        detail: "Async-fähig für gleichzeitige Anfragen. Pydantic v2 für strenge Daten-Validierung (Medikamentendosen, Vitalwert-Ranges). Auto-generierte OpenAPI-Docs = wertvolle IEC 62304-Dokumentation. Dependency Injection für DB-Sessions, Auth, Audit.",
        impl: "Projektstruktur: /app/api/v1/endpoints/, /app/models/, /app/schemas/, /app/services/, /app/core/. Alle Schemas von FHIR-Ressourcen ableiten.",
        pflicht: true,
      },
      {
        name: "fhir.resources (Python FHIR Library)",
        role: "FHIR R4 Datenmodelle & Validierung",
        detail: "Python-Implementierung aller FHIR R4-Ressourcen. Validiert automatisch gegen FHIR-Spezifikation. CH Core Extensions einbinden für Schweiz-spezifische Felder (AHV-Nummer, Versicherungsdaten).",
        impl: "pip install fhir.resources. Eigene CH-Profile als Pydantic-Subklassen. FHIR Bundle für EPD-Export generieren. FHIR-Suchparameter implementieren.",
        pflicht: true,
      },
      {
        name: "hl7apy",
        role: "HL7v2 Message Parser & Builder",
        detail: "Medizinische Geräte (Monitore, Beatmung, Labor) senden HL7v2-Nachrichten (ADT, ORU, ORM). Parser für eingehende Nachrichten. Builder für Antworten (ACK). MLLP-Protokoll (Minimal Lower Layer Protocol) für TCP-Kommunikation.",
        impl: "pip install hl7apy. MLLP-Server als separater Microservice. Parsed Messages → RabbitMQ → FastAPI Worker verarbeitet und speichert in DB.",
        pflicht: true,
      },
      {
        name: "Keycloak 24+",
        role: "Identity & Access Management (IAM)",
        detail: "Open-Source IAM. SMART on FHIR-kompatibel (OAuth 2.0 + FHIR Scopes). Rollen: Arzt, Pflege, Physiotherapie, Admin, Patient, Extern. Attribute-Based Access Control (ABAC): Zugriff abhängig von Station, Schicht, Behandlungsbeziehung. Multi-Factor Authentication (MFA) für alle Benutzer. Single Sign-On (SSO) mit Spital-LDAP/AD.",
        impl: "Docker: keycloak/keycloak:24. Realm 'pdms' konfigurieren. FHIR-spezifische Scopes definieren (patient/*.read, observation/*.write). FastAPI-Middleware validiert Keycloak-Tokens.",
        pflicht: true,
      },
      {
        name: "Celery + Redis",
        role: "Asynchrone Task-Verarbeitung",
        detail: "Hintergrund-Tasks: HL7v2-Nachrichtenverarbeitung, FHIR-Bundle-Generierung, PDF-Report-Erstellung, Alarm-Eskalation, Daten-Archivierung, Scheduled Tasks (z.B. stündliche Fluid Balance Berechnung).",
        impl: "Celery mit Redis als Broker. Beat Scheduler für periodische Tasks. Retry-Logic für fehlgeschlagene Tasks. Dead-Letter-Queue für manuelle Prüfung.",
        pflicht: true,
      },
      {
        name: "Audit-Trail Middleware",
        role: "Lückenlose Protokollierung aller Datenzugriffe",
        detail: "Gesetzlich vorgeschrieben (nDSG, IEC 62304). Jeder API-Call wird geloggt: Wer (User-ID, Rolle), Wann (Timestamp), Was (Ressource, Aktion, Felder), Woher (IP, Device). Unveränderliches Append-Only Log. Separate Audit-Datenbank.",
        impl: "FastAPI Middleware die vor/nach jedem Request loggt. Audit-Events als strukturiertes JSON in separate PostgreSQL-Tabelle (write-only, kein DELETE/UPDATE möglich).",
        pflicht: true,
      },
      {
        name: "HAPI FHIR Server (Java) oder FHIR Facade",
        role: "FHIR-kompatibler Endpunkt für EPD & externe Systeme",
        detail: "Zwei Optionen: (A) HAPI FHIR als eigenständiger FHIR-Server neben FastAPI. (B) FHIR-Facade in FastAPI die interne Daten als FHIR-Ressourcen exponiert. Option B ist leichtgewichtiger, Option A ist vollständiger.",
        impl: "Start mit FHIR-Facade in FastAPI (eigene /fhir/ Routen). Später optional HAPI FHIR für vollständige FHIR-Server-Funktionalität. CH EPR FHIR IG befolgen.",
        pflicht: true,
      },
    ],
  },
  {
    id: "messaging",
    name: "Messaging & Echtzeit",
    icon: "⚡",
    color: "from-amber-500 to-orange-600",
    accent: "amber",
    desc: "Event-Driven Architecture für Geräte-Daten, Alarme und Echtzeit-Updates",
    priority: "Entwicklung ab Phase 3",
    components: [
      {
        name: "RabbitMQ",
        role: "Message Broker für Geräte & interne Events",
        detail: "Empfängt HL7v2-Nachrichten von Medizingeräten via MLLP-Gateway. Exchanges: device.vitals, device.alarms, clinical.events, audit.events. Queues pro Consumer (Vital-Storage, Alarm-Processor, Audit-Writer). Dead Letter Exchange für fehlgeschlagene Messages.",
        impl: "Docker: rabbitmq:3-management. Exchanges: topic-basiert. Durable Queues mit Acknowledgment. Monitoring via Management UI.",
        pflicht: true,
      },
      {
        name: "Redis 7+",
        role: "Cache, Pub/Sub, Session Store",
        detail: "Pub/Sub für Echtzeit-Events an WebSocket-Server. Cache für häufig abgefragte Daten (aktive Patienten, Medikamentenlisten). Session-Store für Keycloak-Tokens. Rate Limiting für API-Schutz.",
        impl: "Docker: redis:7-alpine. Separate Databases: 0=Cache, 1=Sessions, 2=PubSub. TTL-basiert: Vital-Cache 10s, Stammdaten 5min. Redis Sentinel für HA.",
        pflicht: true,
      },
      {
        name: "WebSocket Server (FastAPI + Socket.IO)",
        role: "Echtzeit-Push an Frontend-Clients",
        detail: "Sendet Vitalparameter-Updates, Alarme, Medikamenten-Erinnerungen an verbundene Clients. Room-basiert: Pro Patient, pro Station, pro Alarm-Priorität. Authentifizierte Verbindungen (Keycloak-Token bei Connect).",
        impl: "python-socketio mit FastAPI. Redis-Adapter für Multi-Server-Setup. Rooms: station:{id}, patient:{id}, alarm:critical. Heartbeat alle 30s.",
        pflicht: true,
      },
      {
        name: "MLLP Gateway",
        role: "HL7v2 TCP-Empfänger für Medizingeräte",
        detail: "Medizinische Geräte senden HL7v2-Nachrichten über MLLP (TCP mit Start/End-Bytes). Gateway empfängt, parsed basic Header, sendet ACK, und leitet an RabbitMQ weiter.",
        impl: "Eigenständiger Python-Service mit asyncio TCP-Server. hl7apy für Parsing. Sendet parsed Messages an RabbitMQ exchange 'device.inbound'.",
        pflicht: true,
      },
    ],
  },
  {
    id: "database",
    name: "Datenbank & Speicher",
    icon: "🐘",
    color: "from-indigo-500 to-purple-600",
    accent: "indigo",
    desc: "PostgreSQL-basierte Datenhaltung mit Zeitreihen, Audit und Verschlüsselung",
    priority: "Entwicklung ab Phase 1",
    components: [
      {
        name: "PostgreSQL 16+",
        role: "Primäre relationale Datenbank",
        detail: "Alle strukturierten Patientendaten: Stammdaten, Aufenthalte, Diagnosen, Medikation, Verordnungen. JSONB-Spalten für flexible FHIR-Ressourcen. Row-Level Security (RLS) für Datenisolierung pro Station/Patient. Partitionierung nach Zeitraum für Performance.",
        impl: "Docker: postgres:16-alpine. Schemas: clinical (Patientendaten), audit (Audit-Logs), terminology (SNOMED/ICD/LOINC), auth (Keycloak). RLS aktivieren: ALTER TABLE ... ENABLE ROW LEVEL SECURITY.",
        pflicht: true,
      },
      {
        name: "TimescaleDB 2.x",
        role: "Zeitreihen-Extension für Vitalparameter",
        detail: "PostgreSQL-Extension (kein separater Server!). Hypertables für hochfrequente Zeitreihen: Herzfrequenz, SpO2, Blutdruck, Temperatur, Beatmungsparameter. Automatische Partitionierung nach Zeit. Continuous Aggregates für stündliche/tägliche Zusammenfassungen. Compression für Altdaten.",
        impl: "CREATE EXTENSION timescaledb; SELECT create_hypertable('vital_signs', 'recorded_at'); Retention Policy: Rohdaten 90 Tage, aggregiert 10 Jahre. Compression nach 7 Tagen.",
        pflicht: true,
      },
      {
        name: "pgAudit Extension",
        role: "Datenbank-Level Audit-Logging",
        detail: "Loggt alle SQL-Statements auf Datenbank-Ebene. Ergänzt die Application-Level Audit-Middleware. Unveränderlich: Selbst ein DB-Admin kann Audit-Logs nicht manipulieren (separater Log-Stream). Erforderlich für IEC 62304 und nDSG.",
        impl: "CREATE EXTENSION pgaudit; ALTER SYSTEM SET pgaudit.log = 'read, write, ddl'; Audit-Logs an separaten Syslog-Server senden.",
        pflicht: true,
      },
      {
        name: "pgcrypto + TDE",
        role: "Verschlüsselung at-rest",
        detail: "pgcrypto für Feld-Level-Verschlüsselung besonders sensibler Daten (HIV-Status, Psychiatrie-Diagnosen, Suchterkrankungen). Transparent Data Encryption (TDE) für die gesamte Datenbank (PostgreSQL 16+ oder Enterprise). AES-256 für alle Verschlüsselungen.",
        impl: "CREATE EXTENSION pgcrypto; Sensible Felder: pgp_sym_encrypt(data, key). Key Management über HashiCorp Vault. Backup-Verschlüsselung mit gpg.",
        pflicht: true,
      },
      {
        name: "Alembic",
        role: "Datenbank-Migrations-Management",
        detail: "Versionierte Schema-Änderungen. Jede Migration dokumentiert (Was, Warum, Risikoanalyse). Rollback-fähig. Review-Pflicht für jede Migration (IEC 62304 Change Control).",
        impl: "pip install alembic. alembic init migrations. Naming Convention: YYYYMMDD_HHMM_description.py. Jede Migration mit Docstring der den Change erklärt.",
        pflicht: true,
      },
      {
        name: "Backup & Recovery Strategie",
        role: "Point-in-Time Recovery + Disaster Recovery",
        detail: "Continuous WAL Archiving für Point-in-Time Recovery. Tägliche Full Backups + stündliche Inkrementelle. Backup-Verschlüsselung (AES-256). Offsite-Kopie (anderes Rechenzentrum in CH — Daten dürfen die Schweiz nicht verlassen ohne Weiteres!). Regelmässige Recovery-Tests (mindestens quartalsweise).",
        impl: "pgBackRest für Backup-Management. WAL-G für continuous archiving. Backup-Ziel: S3-kompatibel in CH (z.B. Exoscale, Infomaniak). RTO < 1h, RPO < 5min.",
        pflicht: true,
      },
    ],
  },
  {
    id: "interop",
    name: "Interoperabilität & Standards",
    icon: "🔗",
    color: "from-teal-500 to-cyan-600",
    accent: "teal",
    desc: "FHIR, HL7v2, SNOMED CT, ICD-10, LOINC — Kommunikation mit der Gesundheitswelt",
    priority: "Von Anfang an mitdenken",
    components: [
      {
        name: "HL7 FHIR R4 + CH Core Profiles",
        role: "Primärer Datenaustausch-Standard",
        detail: "FHIR R4 ist der internationale Standard. CH Core (eCH-0241) definiert Schweiz-spezifische Erweiterungen: AHV-Nummer als Identifier, CH-Adressformat, Versicherungsinformationen. CH EPR FHIR IG für EPD-Integration. Dein internes Datenmodell sollte sich an FHIR-Ressourcen orientieren.",
        impl: "FHIR-Ressourcen als Basis-Datenmodell: Patient, Encounter, Observation, MedicationRequest, Condition, Procedure, DiagnosticReport, AllergyIntolerance, DocumentReference. CH Core Extensions einbinden.",
        pflicht: true,
      },
      {
        name: "SNOMED CT (Swiss Extension)",
        role: "Klinische Terminologie für Befunde & Prozeduren",
        detail: "International standardisierte klinische Begriffe. Schweiz hat eine nationale SNOMED CT Lizenz (via BFS). Wird im EPD als Reference-Terminologie verwendet. Ermöglicht semantische Interoperabilität zwischen Systemen.",
        impl: "SNOMED CT RF2-Distribution laden. In Terminologie-Schema importieren. Suchfunktion mit Elastic/Typesense für schnelle Autovervollständigung. Swiss Extension für CH-spezifische Concepts.",
        pflicht: true,
      },
      {
        name: "ICD-10-GM / ICD-11",
        role: "Diagnose-Klassifikation",
        detail: "ICD-10-GM wird in der Schweiz für die Abrechnung und Statistik verwendet (BFS). ICD-11 als zukunftssicherer Standard. Jede Diagnose im PDMS muss ICD-codiert sein.",
        impl: "ICD-10-GM Katalog vom BFS importieren. Autovervollständigung bei Diagnose-Eingabe. Mapping ICD-10 → ICD-11 vorbereiten.",
        pflicht: true,
      },
      {
        name: "LOINC",
        role: "Laborwert-Codierung",
        detail: "Universelle Codes für Laboruntersuchungen und klinische Beobachtungen. Jede Observation im FHIR-Modell braucht einen LOINC-Code. Ermöglicht Labor-System-Integration.",
        impl: "LOINC-Tabelle importieren (loinc.org). Mapping zu lokalen Laborparameter-Namen. LOINC-Codes in Observation.code verwenden.",
        pflicht: true,
      },
      {
        name: "IHE-Profile (XDS.b, PIX/PDQm, MHD)",
        role: "EPD-Integrationsprofile",
        detail: "IHE definiert die technischen Profile für das Schweizer EPD. XDS.b: Document Sharing. PIX/PDQm: Patient Identifier Cross-Referencing. MHD: Mobile Access to Health Documents (FHIR-basiert). In der Schweiz gesetzlich vorgeschrieben für EPD-Anbindung.",
        impl: "CH EPR FHIR IG implementieren. MHD (Mobile Health Documents) als FHIR-basierte Alternative zu XDS.b. Testen gegen EPD-Referenzumgebung (Gazelle).",
        pflicht: true,
      },
    ],
  },
  {
    id: "security",
    name: "Sicherheit & Datenschutz",
    icon: "🔒",
    color: "from-gray-700 to-gray-900",
    accent: "gray",
    desc: "Defense in Depth — Sicherheit auf jeder Ebene",
    priority: "Von Tag 1 an",
    components: [
      {
        name: "TLS 1.3 überall",
        role: "Verschlüsselung in Transit",
        detail: "Alle Verbindungen verschlüsselt: Browser ↔ Nginx, Nginx ↔ FastAPI, FastAPI ↔ PostgreSQL, Service ↔ Service. Keine Ausnahmen, auch nicht im internen Netzwerk. Certificate Pinning für Mobile-Apps.",
        impl: "Let's Encrypt oder Spital-PKI für Zertifikate. Nginx: ssl_protocols TLSv1.3; Interne mTLS zwischen Services (mutual TLS). HSTS-Header setzen.",
        pflicht: true,
      },
      {
        name: "SMART on FHIR",
        role: "OAuth 2.0 für FHIR-APIs",
        detail: "Standard-Protokoll für autorisierte FHIR-API-Zugriffe. Definiert Scopes pro FHIR-Ressource (patient/Observation.read, user/MedicationRequest.write). Ermöglicht sichere Drittanbieter-Apps. Keycloak als Authorization Server.",
        impl: "Keycloak SMART on FHIR Plugin. Scopes definieren pro Rolle. Launch-Context für EHR-embedded Apps. Token-Lifetime: Access 5min, Refresh 8h (Schichtlänge).",
        pflicht: true,
      },
      {
        name: "HashiCorp Vault",
        role: "Secrets & Key Management",
        detail: "Zentrale Verwaltung aller Secrets: DB-Passwörter, API-Keys, Verschlüsselungsschlüssel, TLS-Zertifikate. Dynamic Secrets: Vault generiert kurzlebige DB-Credentials. Encryption as a Service: Vault verschlüsselt Daten ohne dass der Key die App verlässt.",
        impl: "Docker: hashicorp/vault. KV-Store für statische Secrets. Transit Engine für Feld-Verschlüsselung. Database Engine für dynamische PostgreSQL-Credentials.",
        pflicht: true,
      },
      {
        name: "Content Security Policy (CSP) & Security Headers",
        role: "Browser-Sicherheit",
        detail: "CSP verhindert XSS-Angriffe (kritisch bei Patientendaten in der UI). Strict CSP: nur eigene Scripts und definierte CDNs. Weitere Headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.",
        impl: "Nginx-Konfiguration mit allen Security-Headers. CSP: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
        pflicht: true,
      },
      {
        name: "Penetration Testing & SAST/DAST",
        role: "Kontinuierliche Sicherheitstests",
        detail: "SAST (Static Application Security Testing): Code-Analyse bei jedem Commit. DAST (Dynamic Application Security Testing): Laufzeit-Tests. Penetration Testing: Mindestens jährlich durch externe Firma. Vulnerability Scanning: Container-Images, Dependencies.",
        impl: "SAST: SonarQube + Bandit (Python) + ESLint-Security (JS). DAST: OWASP ZAP. Dependency-Check: Snyk oder Dependabot. Pen-Testing: Schweizer Firma (z.B. Compass Security, Oneconsult).",
        pflicht: true,
      },
    ],
  },
  {
    id: "infra",
    name: "Infrastruktur & Deployment",
    icon: "☁️",
    color: "from-violet-500 to-purple-600",
    accent: "violet",
    desc: "Container-basiertes Deployment mit Hochverfügbarkeit in Schweizer Rechenzentren",
    priority: "Setup ab Phase 1",
    components: [
      {
        name: "Docker + Docker Compose (Dev)",
        role: "Lokale Entwicklungsumgebung",
        detail: "Alle Services als Container: FastAPI, PostgreSQL, TimescaleDB, Redis, RabbitMQ, Keycloak, MLLP-Gateway. docker-compose.yml für One-Command-Setup. Konsistente Umgebung für alle Entwickler.",
        impl: "docker-compose.yml mit allen Services. Volume-Mounts für Datenbank-Persistenz. .env.development für lokale Konfiguration. Health Checks für alle Services.",
        pflicht: true,
      },
      {
        name: "Kubernetes (K8s) — Produktion",
        role: "Container-Orchestrierung & Hochverfügbarkeit",
        detail: "Für Produktion: Kubernetes für automatisches Scaling, Rolling Updates, Self-Healing. Managed K8s bei Schweizer Cloud-Provider (Exoscale SKS, Infomaniak, Swisscom). Namespaces: production, staging, monitoring.",
        impl: "Helm Charts für jedes Service. Liveness/Readiness Probes. Resource Limits. Network Policies für Service-Isolation. Secrets via Vault-Injector.",
        pflicht: true,
      },
      {
        name: "Schweizer Cloud-Hosting",
        role: "Daten-Souveränität & nDSG-Compliance",
        detail: "Gesundheitsdaten MÜSSEN in der Schweiz gehostet werden (nDSG, EDÖB-Empfehlung). Kein AWS/Azure/GCP in EU-Regionen — für Gesundheitsdaten reicht das nicht ohne Weiteres. Schweizer Anbieter: Exoscale (CH), Infomaniak (Genf), Swisscom (div.), Green.ch.",
        impl: "Primäres RZ in CH + Backup-RZ in CH (anderer Standort). Exoscale: SKS (Managed K8s) + SOS (S3-kompatibel für Backups). Verfügbarkeit: 99.9% SLA minimum.",
        pflicht: true,
      },
      {
        name: "GitHub Actions + SonarQube",
        role: "CI/CD Pipeline (IEC 62304 konform)",
        detail: "Automatisierte Build → Test → Scan → Deploy Pipeline. Jeder Merge-Request: Unit-Tests, Integration-Tests, SAST, Dependency-Check, Linting. IEC 62304 erfordert dokumentierte Verifikation jeder Software-Änderung. Pipeline-Logs = Verifikationsnachweis.",
        impl: "GitHub Actions Workflow: lint → test → security-scan → build → deploy-staging → smoke-tests → deploy-prod. Branch Protection: Main nur via reviewed PR. Jeder PR referenziert Ticket (Traceability).",
        pflicht: true,
      },
      {
        name: "Prometheus + Grafana + Loki",
        role: "Monitoring, Alerting & Logging",
        detail: "Prometheus: Metriken aller Services (Response-Times, Error-Rates, Queue-Längen). Grafana: Dashboards für Operations-Team. Loki: Zentrale Log-Aggregation. Alertmanager: Eskalation bei Problemen (PagerDuty/SMS).",
        impl: "kube-prometheus-stack via Helm. Dashboards: API-Performance, DB-Connections, Queue-Backlogs, WebSocket-Connections. Alerts: Error-Rate > 1%, Response > 2s, DB-Replikation-Lag.",
        pflicht: true,
      },
    ],
  },
];

// ─── TECH STACK SUMMARY ───
const STACK_SUMMARY = [
  { layer: "Frontend", tools: "React 18 + TypeScript, Next.js 14, TanStack Query, Recharts/D3, Tailwind + shadcn/ui, Socket.IO Client, Workbox PWA, react-i18next" },
  { layer: "Backend", tools: "Python 3.12 + FastAPI, fhir.resources, hl7apy, Keycloak 24, Celery + Redis, HAPI FHIR / FHIR Facade, Audit Middleware" },
  { layer: "Messaging", tools: "RabbitMQ (Device Events), Redis 7 (PubSub/Cache), WebSocket Server (Socket.IO), MLLP Gateway (HL7v2)" },
  { layer: "Datenbank", tools: "PostgreSQL 16 + TimescaleDB, pgAudit, pgcrypto, Alembic Migrations, pgBackRest + WAL-G" },
  { layer: "Standards", tools: "HL7 FHIR R4 + CH Core, HL7v2, SNOMED CT, ICD-10-GM, LOINC, IHE (XDS.b, MHD, PIX/PDQm)" },
  { layer: "Sicherheit", tools: "TLS 1.3, SMART on FHIR, HashiCorp Vault, CSP Headers, SonarQube + Bandit + OWASP ZAP, Pen-Testing" },
  { layer: "Infra", tools: "Docker/K8s, CH-Cloud (Exoscale/Infomaniak), GitHub Actions, Prometheus + Grafana + Loki" },
  { layer: "Regulatorik", tools: "IEC 62304, ISO 14971, ISO 13485, EU MDR/CH-MepV, nDSG, EPDG, CE-Kennzeichnung" },
];

// ─── COMPONENT ───
function LayerSection({ layer, isOpen, toggle }) {
  const accentMap = {
    red: { bg: "bg-red-50", border: "border-red-200", tag: "bg-red-100 text-red-700", dot: "bg-red-500" },
    cyan: { bg: "bg-cyan-50", border: "border-cyan-200", tag: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500" },
    green: { bg: "bg-green-50", border: "border-green-200", tag: "bg-green-100 text-green-700", dot: "bg-green-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", tag: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    indigo: { bg: "bg-indigo-50", border: "border-indigo-200", tag: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
    teal: { bg: "bg-teal-50", border: "border-teal-200", tag: "bg-teal-100 text-teal-700", dot: "bg-teal-500" },
    gray: { bg: "bg-gray-50", border: "border-gray-200", tag: "bg-gray-200 text-gray-700", dot: "bg-gray-600" },
    violet: { bg: "bg-violet-50", border: "border-violet-200", tag: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  };
  const a = accentMap[layer.accent];

  return (
    <div className={`rounded-xl border-2 ${a.border} overflow-hidden`}>
      <button
        onClick={toggle}
        className={`w-full px-5 py-4 flex items-center justify-between ${a.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{layer.icon}</span>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900">{layer.name}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.tag}`}>
                {layer.components.length} Komponenten
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{layer.desc}</p>
          </div>
        </div>
        <span className="text-gray-400 ml-3 flex-shrink-0 text-lg">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 bg-white">
          <div className={`${a.bg} ${a.border} border rounded-lg px-3 py-2`}>
            <span className={`text-xs font-bold ${a.tag.split(" ")[1]}`}>⏱ TIMING: </span>
            <span className="text-xs text-gray-700">{layer.priority}</span>
          </div>
          {layer.components.map((comp, i) => (
            <ComponentCard key={i} comp={comp} accent={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentCard({ comp, accent }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${accent.dot}`}></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-gray-900">{comp.name}</span>
            {comp.pflicht && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">PFLICHT</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{comp.role}</p>
        </div>
        <span className="text-gray-300 flex-shrink-0">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
          <div>
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Was & Warum</h5>
            <p className="text-sm text-gray-700 leading-relaxed">{comp.detail}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Implementation</h5>
            <p className="text-sm text-gray-200 leading-relaxed font-mono">{comp.impl}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PDMSFullStack() {
  const [openLayers, setOpenLayers] = useState({ regulatory: true });
  const [activeView, setActiveView] = useState("stack");

  const toggleLayer = (id) =>
    setOpenLayers((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-1.5 rounded-full mb-3">
            <span className="text-xs font-bold text-red-700">🇨🇭 SCHWEIZ · MEDIZINPRODUKT · IEC 62304 · nDSG · EPD</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            PDMS — Kompletter Tech-Stack
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-2xl mx-auto">
            Patient Data Management System — 8 Schichten, 45+ Komponenten, alle Schweizer Anforderungen.
            Jede Komponente mit Begründung und Implementationsanleitung.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6 justify-center">
          {[
            { id: "stack", label: "🏗️ Vollständiger Stack" },
            { id: "summary", label: "📋 Übersicht" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === v.id
                  ? "bg-gray-900 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {activeView === "summary" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 bg-gray-900 text-white">
                <h2 className="font-bold text-lg">Stack-Übersicht — Alle Schichten</h2>
                <p className="text-xs text-gray-400 mt-1">Kopiere diese Tabelle als Referenz für dein Architektur-Dokument</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase w-1/5">Schicht</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Technologien & Tools</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STACK_SUMMARY.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-sm text-gray-900">{row.layer}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {row.tools.split(", ").map((t, j) => (
                              <span key={j} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Architecture Diagram */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Architektur-Schichten (Top → Bottom)</h3>
              <div className="space-y-1">
                {STACK_LAYERS.map((layer) => (
                  <div key={layer.id} className="flex items-center gap-3">
                    <div className={`h-12 flex-1 bg-gradient-to-r ${layer.color} rounded-lg flex items-center justify-between px-4`}>
                      <span className="text-white font-bold text-sm">{layer.icon} {layer.name}</span>
                      <span className="text-white/70 text-xs">{layer.components.length} Komp.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { num: "8", label: "Schichten" },
                { num: "45+", label: "Komponenten" },
                { num: "6", label: "CH-Gesetze" },
                { num: "18+", label: "Monate MVP" },
              ].map((n, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-black text-gray-900">{n.num}</div>
                  <div className="text-xs text-gray-500 mt-1">{n.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === "stack" && (
          <div className="space-y-4">
            {/* Expand/Collapse All */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  const all = {};
                  STACK_LAYERS.forEach((l) => (all[l.id] = true));
                  setOpenLayers(all);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Alle öffnen
              </button>
              <button
                onClick={() => setOpenLayers({})}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Alle schliessen
              </button>
            </div>

            {/* Stack Layers */}
            {STACK_LAYERS.map((layer) => (
              <LayerSection
                key={layer.id}
                layer={layer}
                isOpen={!!openLayers[layer.id]}
                toggle={() => toggleLayer(layer.id)}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-xl mb-3">🚀 Nächster Schritt</h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Dieser Stack ist dein vollständiger Bauplan. Die Reihenfolge ist entscheidend:
          </p>
          <div className="space-y-2">
            {[
              { phase: "1", text: "Regulatorik & QMS aufsetzen (IEC 62304, ISO 14971, ISO 13485)", time: "Monat 1–3" },
              { phase: "2", text: "Dev-Environment (Docker Compose), DB-Schema, Auth (Keycloak), FHIR-Datenmodell", time: "Monat 2–5" },
              { phase: "3", text: "Core CRUD: Patient, Encounter, Observation + React-Dashboard + Audit-Trail", time: "Monat 4–8" },
              { phase: "4", text: "Echtzeit: TimescaleDB, WebSocket, RabbitMQ, HL7v2-Gateway (Simulator)", time: "Monat 8–12" },
              { phase: "5", text: "Klinische Features: Medikation, Labor, Alarme, FHIR-Export, EPD-Anbindung", time: "Monat 10–16" },
              { phase: "6", text: "Härtung: Pen-Testing, Lasttests, IEC 62304-Dokumentation, Zertifizierung", time: "Monat 14–18+" },
            ].map((p) => (
              <div key={p.phase} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {p.phase}
                </div>
                <div className="flex-1">
                  <span className="text-sm">{p.text}</span>
                  <span className="text-xs text-gray-400 ml-2">({p.time})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-400">
          PDMS Schweiz · Kompletter Tech-Stack · Version 1.0 · Feb. 2026
        </div>
      </div>
    </div>
  );
}
