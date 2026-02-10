import { useState } from "react";

// ═══════════════════════════════════════════════════════════════
// PDMS HOME-SPITAL — KOMPLETTE PLANUNGS-DOKUMENTATION
// 5 Module: DB-Schema · API-Katalog · RBAC · Monorepo · Docker
// ═══════════════════════════════════════════════════════════════

// ─── PDMS-Datenbank-Schema ───────────────────────────────────


// ─── SCHEMA DATA ────────────────────────────────────

const TABLES = {
  // ── CORE ──
  patient: {
    group: "core",
    name: "patient",
    label: "Patient",
    icon: "👤",
    desc: "Stammdaten — Grundlage aller Seiten",
    wireframe: "Personalien",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key (gen_random_uuid)" },
      { name: "fhir_id", type: "VARCHAR(64)", nullable: false, unique: true, desc: "FHIR Patient Resource ID" },
      { name: "ahv_nummer", type: "VARCHAR(16)", nullable: false, unique: true, desc: "AHV-Nr. (756.xxxx.xxxx.xx)" },
      { name: "nachname", type: "VARCHAR(100)", nullable: false, desc: "Familienname" },
      { name: "vorname", type: "VARCHAR(100)", nullable: false, desc: "Vorname(n)" },
      { name: "geburtsdatum", type: "DATE", nullable: false, desc: "Geburtsdatum" },
      { name: "geschlecht", type: "VARCHAR(20)", nullable: false, desc: "männlich / weiblich / divers / unbekannt" },
      { name: "strasse", type: "VARCHAR(200)", nullable: true, desc: "Strasse + Nr." },
      { name: "plz", type: "VARCHAR(10)", nullable: true, desc: "Postleitzahl" },
      { name: "ort", type: "VARCHAR(100)", nullable: true, desc: "Wohnort" },
      { name: "kanton", type: "VARCHAR(2)", nullable: true, desc: "Kanton (z.B. VD, BE, ZH)" },
      { name: "telefon", type: "VARCHAR(20)", nullable: true, desc: "Telefonnummer" },
      { name: "email", type: "VARCHAR(200)", nullable: true, desc: "E-Mail-Adresse" },
      { name: "sprache", type: "VARCHAR(5)", nullable: false, default: "'de'", desc: "Sprache (de, fr, it, en)" },
      { name: "blutgruppe", type: "VARCHAR(5)", nullable: true, desc: "Blutgruppe (A+, B-, O+ etc.)" },
      { name: "allergien", type: "TEXT", nullable: true, desc: "Bekannte Allergien (Freitext)" },
      { name: "status", type: "VARCHAR(20)", nullable: false, default: "'aktiv'", desc: "aktiv / entlassen / verstorben" },
      { name: "aufnahme_datum", type: "TIMESTAMPTZ", nullable: false, desc: "Aufnahmedatum Home-Spital" },
      { name: "entlassung_datum", type: "TIMESTAMPTZ", nullable: true, desc: "Entlassungsdatum (NULL = aktiv)" },
      { name: "epd_status", type: "VARCHAR(20)", nullable: false, default: "'nicht_verbunden'", desc: "EPD-Status (EPDG Art. 9)" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "Erstellungszeitpunkt" },
      { name: "updated_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "Letzte Änderung" },
      { name: "created_by", type: "UUID", fk: "app_user.id", desc: "Erstellt von (User)" },
      { name: "updated_by", type: "UUID", fk: "app_user.id", desc: "Geändert von (User)" },
    ],
  },
  insurance: {
    group: "core",
    name: "insurance",
    label: "Versicherung",
    icon: "🏥",
    desc: "Krankenkasse + Zusatzversicherung",
    wireframe: "Personalien",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "typ", type: "VARCHAR(20)", nullable: false, desc: "grund / zusatz / unfall / iv" },
      { name: "versicherer_name", type: "VARCHAR(200)", nullable: false, desc: "Name der Krankenkasse" },
      { name: "versicherer_gln", type: "VARCHAR(13)", nullable: true, desc: "GLN des Versicherers" },
      { name: "police_nr", type: "VARCHAR(50)", nullable: false, desc: "Policennummer" },
      { name: "kartennummer", type: "VARCHAR(30)", nullable: true, desc: "Versichertenkartennummer" },
      { name: "gueltig_von", type: "DATE", nullable: false, desc: "Gültig ab" },
      { name: "gueltig_bis", type: "DATE", nullable: true, desc: "Gültig bis" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
      { name: "updated_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },
  emergency_contact: {
    group: "core",
    name: "emergency_contact",
    label: "Notfallkontakt",
    icon: "📞",
    desc: "Kontaktpersonen des Patienten",
    wireframe: "Personalien",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "beziehung", type: "VARCHAR(50)", nullable: false, desc: "Ehepartner, Kind, Eltern etc." },
      { name: "nachname", type: "VARCHAR(100)", nullable: false, desc: "Nachname" },
      { name: "vorname", type: "VARCHAR(100)", nullable: false, desc: "Vorname" },
      { name: "telefon", type: "VARCHAR(20)", nullable: false, desc: "Telefonnummer" },
      { name: "email", type: "VARCHAR(200)", nullable: true, desc: "E-Mail" },
      { name: "ist_vertretung", type: "BOOLEAN", nullable: false, default: "FALSE", desc: "Gesetzl. Vertretungsperson (ZGB)" },
      { name: "prioritaet", type: "INTEGER", nullable: false, default: "1", desc: "Reihenfolge (1 = zuerst anrufen)" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },

  // ── KLINISCH ──
  vital_sign: {
    group: "klinisch",
    name: "vital_sign",
    label: "Vitaldaten",
    icon: "💓",
    desc: "Zeitreihen — TimescaleDB Hypertable",
    wireframe: "Kurve",
    columns: [
      { name: "time", type: "TIMESTAMPTZ", nullable: false, desc: "Messzeitpunkt (TimescaleDB PK)" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "typ", type: "VARCHAR(30)", nullable: false, desc: "herzfrequenz / blutdruck_sys / blutdruck_dia / temperatur / spo2 / atemfrequenz / gewicht" },
      { name: "wert", type: "NUMERIC(8,2)", nullable: false, desc: "Messwert" },
      { name: "einheit", type: "VARCHAR(20)", nullable: false, desc: "bpm, mmHg, °C, %, /min, kg" },
      { name: "quelle", type: "VARCHAR(30)", nullable: false, default: "'manuell'", desc: "manuell / geraet / import" },
      { name: "geraet_id", type: "VARCHAR(100)", nullable: true, desc: "Geräte-ID (bei automatischer Messung)" },
      { name: "notiz", type: "TEXT", nullable: true, desc: "Optionale Bemerkung" },
      { name: "erfasst_von", type: "UUID", nullable: false, fk: "app_user.id", desc: "Erfasst von (User)" },
    ],
  },
  medication: {
    group: "klinisch",
    name: "medication",
    label: "Medikament",
    icon: "💊",
    desc: "Medikamentenplan (Verordnung)",
    wireframe: "Kurve / Arzt",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "wirkstoff", type: "VARCHAR(200)", nullable: false, desc: "Wirkstoff (INN)" },
      { name: "handelsname", type: "VARCHAR(200)", nullable: true, desc: "Handelsname" },
      { name: "atc_code", type: "VARCHAR(10)", nullable: true, desc: "ATC-Code (WHO)" },
      { name: "dosis", type: "VARCHAR(50)", nullable: false, desc: "z.B. 500 mg, 10 ml" },
      { name: "einnahme_schema", type: "JSONB", nullable: false, desc: "{morgen: true, mittag: false, abend: true, nacht: false}" },
      { name: "verabreichungsart", type: "VARCHAR(30)", nullable: false, desc: "oral / iv / sc / im / topisch / inhalativ" },
      { name: "start_datum", type: "DATE", nullable: false, desc: "Verordnung ab" },
      { name: "end_datum", type: "DATE", nullable: true, desc: "Verordnung bis (NULL = dauerhaft)" },
      { name: "verordnet_von", type: "UUID", nullable: false, fk: "app_user.id", desc: "Verordnender Arzt" },
      { name: "status", type: "VARCHAR(20)", nullable: false, default: "'aktiv'", desc: "aktiv / pausiert / abgesetzt" },
      { name: "grund", type: "TEXT", nullable: true, desc: "Indikation / Grund" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
      { name: "updated_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },
  medication_admin: {
    group: "klinisch",
    name: "medication_admin",
    label: "Medikamentengabe",
    icon: "💉",
    desc: "Dokumentation jeder einzelnen Gabe",
    wireframe: "Pflege / Kurve",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "medication_id", type: "UUID", nullable: false, fk: "medication.id", desc: "FK → Medikament" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "geplant_um", type: "TIMESTAMPTZ", nullable: false, desc: "Geplanter Zeitpunkt" },
      { name: "gegeben_um", type: "TIMESTAMPTZ", nullable: true, desc: "Tatsächlich gegeben (NULL = ausstehend)" },
      { name: "status", type: "VARCHAR(20)", nullable: false, default: "'geplant'", desc: "geplant / gegeben / verweigert / ausgelassen" },
      { name: "gegeben_von", type: "UUID", nullable: true, fk: "app_user.id", desc: "Verabreicht von (Pflegeperson)" },
      { name: "notiz", type: "TEXT", nullable: true, desc: "Bemerkung zur Gabe" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },
  alarm: {
    group: "klinisch",
    name: "alarm",
    label: "Alarm",
    icon: "🚨",
    desc: "Vitaldaten-Alarme bei Grenzwertüberschreitung",
    wireframe: "Kurve / Dashboard",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "typ", type: "VARCHAR(30)", nullable: false, desc: "vital_hoch / vital_tief / medikament_verpasst" },
      { name: "schwere", type: "VARCHAR(10)", nullable: false, desc: "kritisch / warnung / info" },
      { name: "parameter", type: "VARCHAR(30)", nullable: false, desc: "Betroffener Parameter (z.B. herzfrequenz)" },
      { name: "wert", type: "NUMERIC(8,2)", nullable: true, desc: "Auslösender Wert" },
      { name: "grenzwert", type: "NUMERIC(8,2)", nullable: true, desc: "Definierter Grenzwert" },
      { name: "nachricht", type: "TEXT", nullable: false, desc: "Alarm-Text" },
      { name: "status", type: "VARCHAR(20)", nullable: false, default: "'offen'", desc: "offen / bestätigt / geschlossen" },
      { name: "ausgeloest_um", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "Auslösezeitpunkt" },
      { name: "bestaetigt_um", type: "TIMESTAMPTZ", nullable: true, desc: "Quittiert um" },
      { name: "bestaetigt_von", type: "UUID", nullable: true, fk: "app_user.id", desc: "Quittiert von" },
    ],
  },

  // ── DOKUMENTATION ──
  clinical_note: {
    group: "dokumentation",
    name: "clinical_note",
    label: "Ärztl. Eintrag",
    icon: "📝",
    desc: "Ärztliche Dokumentation (Verlauf, Diagnose, Anordnung)",
    wireframe: "Arzt",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "kategorie", type: "VARCHAR(30)", nullable: false, desc: "verlauf / diagnose / anordnung / konsil / entlassung" },
      { name: "titel", type: "VARCHAR(200)", nullable: false, desc: "Titel des Eintrags" },
      { name: "inhalt", type: "TEXT", nullable: false, desc: "Strukturierter Inhalt (Markdown)" },
      { name: "icd10_codes", type: "JSONB", nullable: true, desc: "ICD-10 Codes [{code, text}]" },
      { name: "prioritaet", type: "VARCHAR(10)", nullable: false, default: "'normal'", desc: "dringend / normal / niedrig" },
      { name: "autor_id", type: "UUID", nullable: false, fk: "app_user.id", desc: "Verfasser (Arzt)" },
      { name: "mitzeichner_id", type: "UUID", nullable: true, fk: "app_user.id", desc: "Gegenzeichnung (optional)" },
      { name: "status", type: "VARCHAR(20)", nullable: false, default: "'entwurf'", desc: "entwurf / freigegeben / archiviert" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
      { name: "updated_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },
  nursing_entry: {
    group: "dokumentation",
    name: "nursing_entry",
    label: "Pflege-Eintrag",
    icon: "🩺",
    desc: "Pflege-Schichtprotokoll + Massnahmen",
    wireframe: "Pflege",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "schicht", type: "VARCHAR(10)", nullable: false, desc: "frueh / spaet / nacht" },
      { name: "kategorie", type: "VARCHAR(30)", nullable: false, desc: "assessment / massnahme / beobachtung / uebergabe" },
      { name: "inhalt", type: "TEXT", nullable: false, desc: "Freitext Eintrag" },
      { name: "wunddoku", type: "JSONB", nullable: true, desc: "Wunddokumentation {lokalisation, groesse, stadium}" },
      { name: "schmerz_score", type: "INTEGER", nullable: true, desc: "Schmerz VAS 0–10" },
      { name: "sturzrisiko", type: "VARCHAR(10)", nullable: true, desc: "niedrig / mittel / hoch" },
      { name: "autor_id", type: "UUID", nullable: false, fk: "app_user.id", desc: "Verfasser (Pflegeperson)" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },

  // ── PLANUNG ──
  appointment: {
    group: "planung",
    name: "appointment",
    label: "Termin",
    icon: "📅",
    desc: "Terminkalender (Besuche, Therapien)",
    wireframe: "Termine",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "typ", type: "VARCHAR(30)", nullable: false, desc: "visite / therapie / labor / transport / telefon" },
      { name: "titel", type: "VARCHAR(200)", nullable: false, desc: "Beschreibung" },
      { name: "beginn", type: "TIMESTAMPTZ", nullable: false, desc: "Startzeit" },
      { name: "ende", type: "TIMESTAMPTZ", nullable: false, desc: "Endzeit" },
      { name: "ganztaegig", type: "BOOLEAN", nullable: false, default: "FALSE", desc: "Ganztägig ja/nein" },
      { name: "ort", type: "VARCHAR(200)", nullable: true, desc: "Adresse / Raum" },
      { name: "zugewiesen_an", type: "UUID", nullable: true, fk: "app_user.id", desc: "Zugewiesene Fachperson" },
      { name: "status", type: "VARCHAR(20)", nullable: false, default: "'geplant'", desc: "geplant / bestaetigt / abgeschlossen / abgesagt" },
      { name: "wiederholung", type: "JSONB", nullable: true, desc: "Wiederholungsmuster {freq, interval, bis}" },
      { name: "notiz", type: "TEXT", nullable: true, desc: "Bemerkungen" },
      { name: "erstellt_von", type: "UUID", nullable: false, fk: "app_user.id", desc: "Erstellt von" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
      { name: "updated_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },

  // ── RECHTLICH ──
  consent: {
    group: "rechtlich",
    name: "consent",
    label: "Einwilligung",
    icon: "✅",
    desc: "Datenschutz-Einwilligungen (nDSG)",
    wireframe: "Rechtliche",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "typ", type: "VARCHAR(30)", nullable: false, desc: "behandlung / daten / forschung / epd / foto" },
      { name: "beschreibung", type: "TEXT", nullable: false, desc: "Wofür wird eingewilligt" },
      { name: "erteilt", type: "BOOLEAN", nullable: false, desc: "Einwilligung erteilt ja/nein" },
      { name: "erteilt_am", type: "TIMESTAMPTZ", nullable: true, desc: "Datum der Einwilligung" },
      { name: "widerrufen_am", type: "TIMESTAMPTZ", nullable: true, desc: "Datum des Widerrufs" },
      { name: "gueltig_bis", type: "DATE", nullable: true, desc: "Ablaufdatum (optional)" },
      { name: "dokument_ref", type: "VARCHAR(200)", nullable: true, desc: "Verweis auf gescanntes Dokument" },
      { name: "erfasst_von", type: "UUID", nullable: false, fk: "app_user.id", desc: "Erfasst von" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },
  advance_directive: {
    group: "rechtlich",
    name: "advance_directive",
    label: "Patientenverfügung",
    icon: "⚖️",
    desc: "PV, Vorsorgeauftrag, Palliativ (ZGB 370–378)",
    wireframe: "Rechtliche",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key" },
      { name: "patient_id", type: "UUID", nullable: false, fk: "patient.id", desc: "FK → Patient" },
      { name: "typ", type: "VARCHAR(30)", nullable: false, desc: "patientenverfuegung / vorsorgeauftrag / palliativ / therapeutische_wuensche" },
      { name: "titel", type: "VARCHAR(200)", nullable: false, desc: "Dokumenttitel" },
      { name: "inhalt", type: "TEXT", nullable: true, desc: "Inhalt / Zusammenfassung" },
      { name: "reanimation", type: "VARCHAR(20)", nullable: true, desc: "ja / nein / eingeschraenkt (nur bei PV)" },
      { name: "beatmung", type: "VARCHAR(20)", nullable: true, desc: "ja / nein / eingeschraenkt" },
      { name: "kuenstliche_ernaehrung", type: "VARCHAR(20)", nullable: true, desc: "ja / nein / eingeschraenkt" },
      { name: "aufbewahrungsort", type: "VARCHAR(200)", nullable: true, desc: "Wo liegt das Original" },
      { name: "vertrauensperson_id", type: "UUID", nullable: true, fk: "emergency_contact.id", desc: "Vertretungsperson" },
      { name: "gueltig_ab", type: "DATE", nullable: false, desc: "Gültig ab" },
      { name: "gueltig_bis", type: "DATE", nullable: true, desc: "Gültig bis (optional)" },
      { name: "status", type: "VARCHAR(20)", nullable: false, default: "'aktiv'", desc: "aktiv / widerrufen / abgelaufen" },
      { name: "dokument_ref", type: "VARCHAR(200)", nullable: true, desc: "Scan / Datei-Referenz" },
      { name: "erfasst_von", type: "UUID", nullable: false, fk: "app_user.id", desc: "Erfasst von" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
      { name: "updated_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },

  // ── SYSTEM ──
  app_user: {
    group: "system",
    name: "app_user",
    label: "Benutzer",
    icon: "🔑",
    desc: "Keycloak-synchronisierte Benutzer",
    wireframe: "Alle Seiten",
    columns: [
      { name: "id", type: "UUID", pk: true, desc: "Primary Key (= Keycloak Subject ID)" },
      { name: "keycloak_id", type: "VARCHAR(64)", nullable: false, unique: true, desc: "Keycloak User ID" },
      { name: "email", type: "VARCHAR(200)", nullable: false, unique: true, desc: "E-Mail (Login)" },
      { name: "vorname", type: "VARCHAR(100)", nullable: false, desc: "Vorname" },
      { name: "nachname", type: "VARCHAR(100)", nullable: false, desc: "Nachname" },
      { name: "rolle", type: "VARCHAR(20)", nullable: false, desc: "arzt / pflege / admin" },
      { name: "gln_nummer", type: "VARCHAR(13)", nullable: true, desc: "GLN (nur Ärzte)" },
      { name: "abteilung", type: "VARCHAR(100)", nullable: true, desc: "Abteilung / Team" },
      { name: "ist_aktiv", type: "BOOLEAN", nullable: false, default: "TRUE", desc: "Account aktiv" },
      { name: "letzter_login", type: "TIMESTAMPTZ", nullable: true, desc: "Letzter Login-Zeitpunkt" },
      { name: "created_at", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "" },
    ],
  },
  audit_log: {
    group: "system",
    name: "audit_log",
    label: "Audit-Log",
    icon: "📜",
    desc: "Lückenloser Audit-Trail (pgAudit + App-Level)",
    wireframe: "Compliance",
    columns: [
      { name: "id", type: "BIGSERIAL", pk: true, desc: "Auto-Increment PK" },
      { name: "tabelle", type: "VARCHAR(50)", nullable: false, desc: "Betroffene Tabelle" },
      { name: "datensatz_id", type: "UUID", nullable: false, desc: "ID des betroffenen Datensatzes" },
      { name: "aktion", type: "VARCHAR(10)", nullable: false, desc: "INSERT / UPDATE / DELETE / SELECT" },
      { name: "alte_werte", type: "JSONB", nullable: true, desc: "Werte vor der Änderung" },
      { name: "neue_werte", type: "JSONB", nullable: true, desc: "Werte nach der Änderung" },
      { name: "user_id", type: "UUID", nullable: false, fk: "app_user.id", desc: "Ausführender Benutzer" },
      { name: "ip_adresse", type: "INET", nullable: true, desc: "IP-Adresse des Benutzers" },
      { name: "user_agent", type: "TEXT", nullable: true, desc: "Browser / Client Info" },
      { name: "zeitpunkt", type: "TIMESTAMPTZ", nullable: false, default: "NOW()", desc: "Zeitpunkt der Aktion" },
    ],
  },
};

const GROUPS = {
  core: { label: "Stammdaten", color: "cyan", desc: "Patient, Versicherung, Kontakte" },
  klinisch: { label: "Klinische Daten", color: "rose", desc: "Vitaldaten, Medikamente, Alarme" },
  dokumentation: { label: "Dokumentation", color: "amber", desc: "Ärztliche & Pflege-Einträge" },
  planung: { label: "Planung", color: "emerald", desc: "Termine & Kalender" },
  rechtlich: { label: "Rechtlich", color: "violet", desc: "Einwilligungen, Patientenverfügung" },
  system: { label: "System", color: "slate", desc: "Benutzer, Audit-Trail" },
};

const RELATIONS = [
  { from: "insurance", to: "patient", label: "patient_id", type: "N:1" },
  { from: "emergency_contact", to: "patient", label: "patient_id", type: "N:1" },
  { from: "vital_sign", to: "patient", label: "patient_id", type: "N:1" },
  { from: "medication", to: "patient", label: "patient_id", type: "N:1" },
  { from: "medication_admin", to: "medication", label: "medication_id", type: "N:1" },
  { from: "medication_admin", to: "patient", label: "patient_id", type: "N:1" },
  { from: "alarm", to: "patient", label: "patient_id", type: "N:1" },
  { from: "clinical_note", to: "patient", label: "patient_id", type: "N:1" },
  { from: "nursing_entry", to: "patient", label: "patient_id", type: "N:1" },
  { from: "appointment", to: "patient", label: "patient_id", type: "N:1" },
  { from: "consent", to: "patient", label: "patient_id", type: "N:1" },
  { from: "advance_directive", to: "patient", label: "patient_id", type: "N:1" },
  { from: "advance_directive", to: "emergency_contact", label: "vertrauensperson_id", type: "N:1" },
  { from: "clinical_note", to: "app_user", label: "autor_id", type: "N:1" },
  { from: "nursing_entry", to: "app_user", label: "autor_id", type: "N:1" },
  { from: "medication", to: "app_user", label: "verordnet_von", type: "N:1" },
  { from: "medication_admin", to: "app_user", label: "gegeben_von", type: "N:1" },
  { from: "appointment", to: "app_user", label: "zugewiesen_an", type: "N:1" },
  { from: "audit_log", to: "app_user", label: "user_id", type: "N:1" },
];

// ─── HELPER ─────────────────────────────────────────

const groupColor = (g, part) => {
  const map = {
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-500", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
    rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-500", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", dot: "bg-violet-500", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
    slate: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-400", dot: "bg-slate-500", badge: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  };
  return map[g]?.[part] || "";
};

function genSQL(t) {
  const lines = [`CREATE TABLE ${t.name} (`];
  t.columns.forEach((c, i) => {
    let line = `  ${c.name.padEnd(24)} ${c.type.padEnd(18)}`;
    if (c.pk) line += " PRIMARY KEY";
    else if (c.nullable === false) line += " NOT NULL";
    if (c.unique) line += " UNIQUE";
    if (c.default) line += ` DEFAULT ${c.default}`;
    if (i < t.columns.length - 1) line += ",";
    lines.push(line);
  });
  lines.push(");");
  const fks = t.columns.filter((c) => c.fk);
  fks.forEach((c) => {
    const [refTable, refCol] = c.fk.split(".");
    lines.push(`ALTER TABLE ${t.name} ADD CONSTRAINT fk_${t.name}_${c.name}`);
    lines.push(`  FOREIGN KEY (${c.name}) REFERENCES ${refTable}(${refCol});`);
  });
  if (t.name === "vital_sign") {
    lines.push("");
    lines.push("-- TimescaleDB Hypertable");
    lines.push("SELECT create_hypertable('vital_sign', 'time');");
    lines.push("CREATE INDEX ix_vital_patient_time ON vital_sign (patient_id, time DESC);");
  }
  if (t.name === "audit_log") {
    lines.push("");
    lines.push("-- Partitionierung nach Monat (Performance)");
    lines.push("CREATE INDEX ix_audit_zeitpunkt ON audit_log (zeitpunkt DESC);");
    lines.push("CREATE INDEX ix_audit_user ON audit_log (user_id, zeitpunkt DESC);");
    lines.push("CREATE INDEX ix_audit_datensatz ON audit_log (tabelle, datensatz_id);");
  }
  return lines.join("\n");
}

// ─── COMPONENTS ─────────────────────────────────────

function DbStats() {
  const tables = Object.values(TABLES);
  const totalCols = tables.reduce((s, t) => s + t.columns.length, 0);
  const totalFKs = RELATIONS.length;
  const stats = [
    { n: tables.length, l: "Tabellen" },
    { n: totalCols, l: "Spalten" },
    { n: totalFKs, l: "Relationen" },
    { n: Object.keys(GROUPS).length, l: "Gruppen" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {stats.map((s) => (
        <div key={s.l} className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-center">
          <div className="text-xl font-black text-cyan-400">{s.n}</div>
          <div className="text-xs text-slate-500">{s.l}</div>
        </div>
      ))}
    </div>
  );
}

function TableCard({ table, isActive, onClick }) {
  const g = GROUPS[table.group];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg p-3 border transition-all ${
        isActive
          ? `${groupColor(g.color, "bg")} ${groupColor(g.color, "border")} ring-1 ${groupColor(g.color, "border")}`
          : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{table.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold ${isActive ? groupColor(g.color, "text") : "text-slate-300"}`}>{table.label}</div>
          <div className="text-xs text-slate-500 truncate">{table.columns.length} Spalten · {table.wireframe}</div>
        </div>
      </div>
    </button>
  );
}

function ColumnRow({ col, groupColorName }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-800/50 last:border-0">
      <div className="w-3 flex-shrink-0 pt-1.5">
        {col.pk ? (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Primary Key" />
        ) : col.fk ? (
          <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" title={`FK → ${col.fk}`} />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-sm font-bold text-slate-200">{col.name}</code>
          <span className="text-xs text-slate-500 font-mono">{col.type}</span>
          {col.pk && <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">PK</span>}
          {col.fk && <span className="text-xs font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">FK → {col.fk}</span>}
          {col.unique && <span className="text-xs font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">UNIQUE</span>}
          {col.nullable === false && !col.pk && <span className="text-xs text-rose-400">NOT NULL</span>}
          {col.default && <span className="text-xs text-slate-500">= {col.default}</span>}
        </div>
        {col.desc && <div className="text-xs text-slate-500 mt-0.5">{col.desc}</div>}
      </div>
    </div>
  );
}

function DetailPanel({ table }) {
  const [tab, setTab] = useState("columns");
  const g = GROUPS[table.group];
  const fkCount = table.columns.filter((c) => c.fk).length;
  const incomingRels = RELATIONS.filter((r) => r.to === table.name);
  const outgoingRels = RELATIONS.filter((r) => r.from === table.name);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${groupColor(g.color, "bg")} border-b ${groupColor(g.color, "border")}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{table.icon}</span>
          <div className="flex-1">
            <h3 className="font-black text-white text-lg">{table.label}</h3>
            <p className="text-xs text-slate-400">{table.desc}</p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${groupColor(g.color, "badge")}`}>
            {g.label}
          </span>
        </div>
        <div className="flex gap-3 mt-3 text-xs text-slate-400">
          <span>{table.columns.length} Spalten</span>
          <span>·</span>
          <span>{fkCount} FK</span>
          <span>·</span>
          <span>{incomingRels.length} eingehend</span>
          <span>·</span>
          <span>{outgoingRels.length} ausgehend</span>
          <span>·</span>
          <span>Wireframe: {table.wireframe}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: "columns", label: "Spalten" },
          { id: "sql", label: "SQL" },
          { id: "relations", label: "Relationen" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              tab === t.id ? `${groupColor(g.color, "text")} border-b-2 ${groupColor(g.color, "border")}` : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {tab === "columns" && (
          <div className="space-y-0.5">
            {table.columns.map((col) => (
              <ColumnRow key={col.name} col={col} groupColorName={g.color} />
            ))}
          </div>
        )}
        {tab === "sql" && (
          <pre className="text-xs text-slate-300 font-mono bg-slate-950 rounded-lg p-4 overflow-x-auto whitespace-pre leading-relaxed">
            {genSQL(table)}
          </pre>
        )}
        {tab === "relations" && (
          <div className="space-y-2">
            {outgoingRels.length > 0 && (
              <>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Ausgehend (diese Tabelle → andere)</div>
                {outgoingRels.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-slate-800 rounded-lg p-2">
                    <span className="text-cyan-400 font-mono text-xs">{r.label}</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-bold text-white">{TABLES[r.to]?.icon} {TABLES[r.to]?.label}</span>
                    <span className="ml-auto text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">{r.type}</span>
                  </div>
                ))}
              </>
            )}
            {incomingRels.length > 0 && (
              <>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 mt-3">Eingehend (andere → diese Tabelle)</div>
                {incomingRels.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-slate-800 rounded-lg p-2">
                    <span className="font-bold text-white">{TABLES[r.from]?.icon} {TABLES[r.from]?.label}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-cyan-400 font-mono text-xs">{r.label}</span>
                    <span className="ml-auto text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">{r.type}</span>
                  </div>
                ))}
              </>
            )}
            {outgoingRels.length === 0 && incomingRels.length === 0 && (
              <p className="text-sm text-slate-500">Keine Relationen</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ERDMiniMap({ active, onSelect }) {
  const grouped = {};
  Object.values(TABLES).forEach((t) => {
    if (!grouped[t.group]) grouped[t.group] = [];
    grouped[t.group].push(t);
  });
  return (
    <div className="space-y-3">
      {Object.entries(GROUPS).map(([gKey, gData]) => (
        <div key={gKey}>
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <div className={`w-2 h-2 rounded-full ${groupColor(gData.color, "dot")}`} />
            <span className={`text-xs font-bold ${groupColor(gData.color, "text")} uppercase tracking-wide`}>{gData.label}</span>
          </div>
          <div className="space-y-1">
            {(grouped[gKey] || []).map((t) => (
              <TableCard key={t.name} table={t} isActive={active === t.name} onClick={() => onSelect(t.name)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RelationGraph({ active }) {
  const centerTable = TABLES[active];
  if (!centerTable) return null;
  const outgoing = RELATIONS.filter((r) => r.from === active);
  const incoming = RELATIONS.filter((r) => r.to === active);
  const related = new Set();
  outgoing.forEach((r) => related.add(r.to));
  incoming.forEach((r) => related.add(r.from));

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 mt-4">
      <h3 className="font-bold text-white text-sm mb-3">Beziehungsgraph</h3>
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {/* Incoming */}
        <div className="flex flex-col gap-1 items-end">
          {incoming.map((r, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-xs bg-slate-800 rounded px-2 py-1 text-slate-300">
                {TABLES[r.from]?.icon} {TABLES[r.from]?.label}
              </span>
              <span className="text-slate-600 text-xs">→</span>
            </div>
          ))}
        </div>
        {/* Center */}
        <div className="rounded-xl bg-cyan-500/20 border-2 border-cyan-500 px-4 py-3 mx-2 text-center">
          <span className="text-xl">{centerTable.icon}</span>
          <div className="text-sm font-black text-cyan-300 mt-1">{centerTable.label}</div>
        </div>
        {/* Outgoing */}
        <div className="flex flex-col gap-1 items-start">
          {outgoing.map((r, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-slate-600 text-xs">→</span>
              <span className="text-xs bg-slate-800 rounded px-2 py-1 text-slate-300">
                {TABLES[r.to]?.icon} {TABLES[r.to]?.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {related.size === 0 && <p className="text-xs text-slate-500 text-center">Keine direkten Beziehungen</p>}
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────

function PDMSDatabaseSchema() {
  const [activeTable, setActiveTable] = useState("patient");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full bg-cyan-500" />
            <div>
              <h1 className="text-lg font-black text-white">PDMS Datenbank-Schema</h1>
              <p className="text-xs text-slate-500">PostgreSQL 16 + TimescaleDB · Alle {Object.keys(TABLES).length} Tabellen aus 7 Wireframes</p>
            </div>
            <div className="ml-auto flex gap-1.5">
              {["PostgreSQL 16", "TimescaleDB", "pgAudit", "FHIR R4"].map((b) => (
                <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 hidden sm:inline-block">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <DbStats />

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Table List */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
              <ERDMiniMap active={activeTable} onSelect={setActiveTable} />
            </div>
          </div>

          {/* Right: Detail */}
          <div className="flex-1 min-w-0">
            <DetailPanel table={TABLES[activeTable]} />
            <RelationGraph active={activeTable} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 text-center">
        <p className="text-xs text-slate-700">PDMS Home-Spital · Datenbank-Schema v1.0 · {Object.keys(TABLES).length} Tabellen · {RELATIONS.length} Relationen · Stand Februar 2026</p>
      </div>
    </div>
  );
}

// ─── PDMS-API-Katalog ───────────────────────────────────


// ─── API DATA ───────────────────────────────────────

const API_GROUPS = [
  {
    id: "patients",
    label: "Patienten",
    icon: "👤",
    color: "cyan",
    base: "/api/v1/patients",
    wireframe: "Dashboard / Personalien",
    desc: "CRUD für Patientenstammdaten + Suche",
    endpoints: [
      { method: "GET", path: "/api/v1/patients", desc: "Alle Patienten (paginiert, gefiltert)", params: "?page=1&limit=20&status=aktiv&search=Müller&sort=nachname", response: "{ data: Patient[], total: number, page: number }", roles: ["arzt", "pflege", "admin"], wireframe: "Dashboard" },
      { method: "GET", path: "/api/v1/patients/:id", desc: "Einzelner Patient (Stammdaten komplett)", params: ":id = UUID", response: "Patient (mit Versicherung, Kontakte eager-loaded)", roles: ["arzt", "pflege", "admin"], wireframe: "Personalien" },
      { method: "POST", path: "/api/v1/patients", desc: "Neuen Patienten anlegen", body: "{ nachname, vorname, geburtsdatum, geschlecht, ahv_nummer, ... }", response: "Patient (201 Created)", roles: ["arzt", "admin"], wireframe: "Personalien" },
      { method: "PUT", path: "/api/v1/patients/:id", desc: "Patient aktualisieren", body: "{ nachname?, vorname?, strasse?, plz?, ort?, telefon?, email?, ... }", response: "Patient (200 OK)", roles: ["arzt", "pflege", "admin"], wireframe: "Personalien" },
      { method: "PATCH", path: "/api/v1/patients/:id/status", desc: "Status ändern (aktiv → entlassen)", body: "{ status: 'entlassen', entlassung_datum: '...' }", response: "Patient (200 OK)", roles: ["arzt"], wireframe: "Dashboard" },
      { method: "GET", path: "/api/v1/patients/:id/summary", desc: "Dashboard-Zusammenfassung (Alarme, Vitals, nächster Termin)", params: ":id = UUID", response: "{ alarme_offen: number, letzte_vitals: {...}, naechster_termin: {...} }", roles: ["arzt", "pflege"], wireframe: "Dashboard" },
    ],
  },
  {
    id: "insurance",
    label: "Versicherung",
    icon: "🏥",
    color: "cyan",
    base: "/api/v1/patients/:pid/insurance",
    wireframe: "Personalien",
    desc: "Krankenkasse & Zusatzversicherung pro Patient",
    endpoints: [
      { method: "GET", path: "/api/v1/patients/:pid/insurance", desc: "Alle Versicherungen eines Patienten", params: ":pid = Patient UUID", response: "Insurance[]", roles: ["arzt", "pflege", "admin"], wireframe: "Personalien" },
      { method: "POST", path: "/api/v1/patients/:pid/insurance", desc: "Versicherung hinzufügen", body: "{ typ, versicherer_name, police_nr, gueltig_von, ... }", response: "Insurance (201)", roles: ["admin"], wireframe: "Personalien" },
      { method: "PUT", path: "/api/v1/patients/:pid/insurance/:id", desc: "Versicherung aktualisieren", body: "{ versicherer_name?, police_nr?, gueltig_bis?, ... }", response: "Insurance (200)", roles: ["admin"], wireframe: "Personalien" },
      { method: "DELETE", path: "/api/v1/patients/:pid/insurance/:id", desc: "Versicherung entfernen", params: ":id = Insurance UUID", response: "204 No Content", roles: ["admin"], wireframe: "Personalien" },
    ],
  },
  {
    id: "contacts",
    label: "Notfallkontakte",
    icon: "📞",
    color: "cyan",
    base: "/api/v1/patients/:pid/contacts",
    wireframe: "Personalien",
    desc: "Kontaktpersonen & gesetzliche Vertretung",
    endpoints: [
      { method: "GET", path: "/api/v1/patients/:pid/contacts", desc: "Alle Notfallkontakte", params: ":pid = Patient UUID", response: "EmergencyContact[]", roles: ["arzt", "pflege", "admin"], wireframe: "Personalien" },
      { method: "POST", path: "/api/v1/patients/:pid/contacts", desc: "Kontakt hinzufügen", body: "{ beziehung, nachname, vorname, telefon, ist_vertretung, prioritaet }", response: "EmergencyContact (201)", roles: ["arzt", "pflege", "admin"], wireframe: "Personalien" },
      { method: "PUT", path: "/api/v1/patients/:pid/contacts/:id", desc: "Kontakt aktualisieren", body: "{ telefon?, email?, ist_vertretung?, ... }", response: "EmergencyContact (200)", roles: ["arzt", "pflege", "admin"], wireframe: "Personalien" },
      { method: "DELETE", path: "/api/v1/patients/:pid/contacts/:id", desc: "Kontakt entfernen", params: ":id = Contact UUID", response: "204 No Content", roles: ["arzt", "admin"], wireframe: "Personalien" },
    ],
  },
  {
    id: "vitals",
    label: "Vitaldaten",
    icon: "💓",
    color: "rose",
    base: "/api/v1/patients/:pid/vitals",
    wireframe: "Kurve",
    desc: "Zeitreihen — TimescaleDB optimiert",
    endpoints: [
      { method: "GET", path: "/api/v1/patients/:pid/vitals", desc: "Vitaldaten abfragen (Zeitraum + Typ)", params: "?von=2026-02-01T00:00&bis=2026-02-09T23:59&typ=herzfrequenz&interval=1h", response: "{ data: VitalSign[], aggregiert: { min, max, avg } }", roles: ["arzt", "pflege"], wireframe: "Kurve" },
      { method: "GET", path: "/api/v1/patients/:pid/vitals/latest", desc: "Letzte Messwerte pro Typ", params: ":pid = Patient UUID", response: "{ herzfrequenz: {...}, blutdruck_sys: {...}, temperatur: {...}, ... }", roles: ["arzt", "pflege"], wireframe: "Dashboard / Kurve" },
      { method: "POST", path: "/api/v1/patients/:pid/vitals", desc: "Neuen Messwert erfassen", body: "{ typ, wert, einheit, quelle, geraet_id?, notiz? }", response: "VitalSign (201)", roles: ["arzt", "pflege"], wireframe: "Kurve" },
      { method: "POST", path: "/api/v1/patients/:pid/vitals/batch", desc: "Mehrere Messwerte auf einmal (Gerät-Import)", body: "{ messungen: [{ typ, wert, einheit, time }, ...] }", response: "{ inserted: number } (201)", roles: ["pflege"], wireframe: "Kurve" },
      { method: "GET", path: "/api/v1/patients/:pid/vitals/trends", desc: "Trend-Analyse (Durchschnitte pro Tag/Woche)", params: "?typ=herzfrequenz&granularity=day&tage=30", response: "{ trends: [{ date, avg, min, max }] }", roles: ["arzt"], wireframe: "Kurve" },
    ],
  },
  {
    id: "medications",
    label: "Medikamente",
    icon: "💊",
    color: "rose",
    base: "/api/v1/patients/:pid/medications",
    wireframe: "Kurve / Arzt",
    desc: "Medikamentenplan + Verabreichung",
    endpoints: [
      { method: "GET", path: "/api/v1/patients/:pid/medications", desc: "Medikamentenplan (aktiv/alle)", params: "?status=aktiv&include_admin=true", response: "Medication[] (mit letzter Gabe)", roles: ["arzt", "pflege"], wireframe: "Kurve" },
      { method: "POST", path: "/api/v1/patients/:pid/medications", desc: "Medikament verordnen", body: "{ wirkstoff, dosis, einnahme_schema, verabreichungsart, start_datum, grund }", response: "Medication (201)", roles: ["arzt"], wireframe: "Arzt" },
      { method: "PUT", path: "/api/v1/patients/:pid/medications/:id", desc: "Verordnung ändern", body: "{ dosis?, einnahme_schema?, end_datum?, status? }", response: "Medication (200)", roles: ["arzt"], wireframe: "Arzt" },
      { method: "PATCH", path: "/api/v1/patients/:pid/medications/:id/stop", desc: "Medikament absetzen", body: "{ end_datum, grund? }", response: "Medication (200)", roles: ["arzt"], wireframe: "Arzt" },
      { method: "GET", path: "/api/v1/patients/:pid/medications/:mid/admin", desc: "Gabe-Historie eines Medikaments", params: "?von=...&bis=...", response: "MedicationAdmin[]", roles: ["arzt", "pflege"], wireframe: "Kurve" },
      { method: "POST", path: "/api/v1/patients/:pid/medications/:mid/admin", desc: "Gabe dokumentieren", body: "{ status: 'gegeben'|'verweigert'|'ausgelassen', notiz? }", response: "MedicationAdmin (201)", roles: ["pflege"], wireframe: "Pflege" },
    ],
  },
  {
    id: "alarms",
    label: "Alarme",
    icon: "🚨",
    color: "rose",
    base: "/api/v1/patients/:pid/alarms",
    wireframe: "Dashboard / Kurve",
    desc: "Vitaldaten-Alarme & Quittierung",
    endpoints: [
      { method: "GET", path: "/api/v1/alarms", desc: "Alle offenen Alarme (global — Dashboard)", params: "?status=offen&schwere=kritisch&limit=50", response: "Alarm[] (mit Patient-Info)", roles: ["arzt", "pflege"], wireframe: "Dashboard" },
      { method: "GET", path: "/api/v1/patients/:pid/alarms", desc: "Alarme eines Patienten", params: "?status=offen", response: "Alarm[]", roles: ["arzt", "pflege"], wireframe: "Kurve" },
      { method: "PATCH", path: "/api/v1/patients/:pid/alarms/:id/ack", desc: "Alarm quittieren", body: "{ notiz? }", response: "Alarm (200, status: 'bestätigt')", roles: ["arzt", "pflege"], wireframe: "Kurve" },
      { method: "PATCH", path: "/api/v1/patients/:pid/alarms/:id/close", desc: "Alarm schliessen", body: "{ notiz? }", response: "Alarm (200, status: 'geschlossen')", roles: ["arzt"], wireframe: "Kurve" },
    ],
  },
  {
    id: "notes",
    label: "Ärztl. Einträge",
    icon: "📝",
    color: "amber",
    base: "/api/v1/patients/:pid/notes",
    wireframe: "Arzt",
    desc: "Verlauf, Diagnosen, Anordnungen",
    endpoints: [
      { method: "GET", path: "/api/v1/patients/:pid/notes", desc: "Alle ärztlichen Einträge", params: "?kategorie=verlauf&status=freigegeben&sort=-created_at", response: "ClinicalNote[]", roles: ["arzt", "pflege"], wireframe: "Arzt" },
      { method: "GET", path: "/api/v1/patients/:pid/notes/:id", desc: "Einzelner Eintrag (Detail)", params: ":id = Note UUID", response: "ClinicalNote", roles: ["arzt", "pflege"], wireframe: "Arzt" },
      { method: "POST", path: "/api/v1/patients/:pid/notes", desc: "Neuen Eintrag erstellen", body: "{ kategorie, titel, inhalt, icd10_codes?, prioritaet? }", response: "ClinicalNote (201, status: 'entwurf')", roles: ["arzt"], wireframe: "Arzt" },
      { method: "PUT", path: "/api/v1/patients/:pid/notes/:id", desc: "Eintrag bearbeiten (nur Entwurf)", body: "{ titel?, inhalt?, icd10_codes? }", response: "ClinicalNote (200)", roles: ["arzt"], wireframe: "Arzt" },
      { method: "PATCH", path: "/api/v1/patients/:pid/notes/:id/release", desc: "Eintrag freigeben (nicht mehr editierbar)", body: "{}", response: "ClinicalNote (200, status: 'freigegeben')", roles: ["arzt"], wireframe: "Arzt" },
      { method: "PATCH", path: "/api/v1/patients/:pid/notes/:id/cosign", desc: "Gegenzeichnung (4-Augen-Prinzip)", body: "{}", response: "ClinicalNote (200, mitzeichner_id gesetzt)", roles: ["arzt"], wireframe: "Arzt" },
    ],
  },
  {
    id: "nursing",
    label: "Pflege-Einträge",
    icon: "🩺",
    color: "amber",
    base: "/api/v1/patients/:pid/nursing",
    wireframe: "Pflege",
    desc: "Schichtprotokoll, Assessment, Massnahmen",
    endpoints: [
      { method: "GET", path: "/api/v1/patients/:pid/nursing", desc: "Pflege-Einträge (nach Schicht filterbar)", params: "?schicht=frueh&datum=2026-02-09&kategorie=assessment", response: "NursingEntry[]", roles: ["arzt", "pflege"], wireframe: "Pflege" },
      { method: "POST", path: "/api/v1/patients/:pid/nursing", desc: "Neuen Pflege-Eintrag erstellen", body: "{ schicht, kategorie, inhalt, wunddoku?, schmerz_score?, sturzrisiko? }", response: "NursingEntry (201)", roles: ["pflege"], wireframe: "Pflege" },
      { method: "PUT", path: "/api/v1/patients/:pid/nursing/:id", desc: "Eintrag bearbeiten (nur eigene, < 24h)", body: "{ inhalt?, schmerz_score?, wunddoku? }", response: "NursingEntry (200)", roles: ["pflege"], wireframe: "Pflege" },
      { method: "GET", path: "/api/v1/patients/:pid/nursing/handover", desc: "Übergabe-Zusammenfassung generieren", params: "?schicht=frueh&datum=2026-02-09", response: "{ zusammenfassung: string, eintraege: NursingEntry[] }", roles: ["pflege"], wireframe: "Pflege" },
    ],
  },
  {
    id: "appointments",
    label: "Termine",
    icon: "📅",
    color: "emerald",
    base: "/api/v1/patients/:pid/appointments",
    wireframe: "Termine",
    desc: "Kalender, Visiten, Therapien",
    endpoints: [
      { method: "GET", path: "/api/v1/appointments", desc: "Alle Termine (global — Wochenansicht)", params: "?von=2026-02-09&bis=2026-02-15&zugewiesen_an=UUID", response: "Appointment[] (mit Patient-Info)", roles: ["arzt", "pflege", "admin"], wireframe: "Termine" },
      { method: "GET", path: "/api/v1/patients/:pid/appointments", desc: "Termine eines Patienten", params: "?von=...&bis=...&status=geplant", response: "Appointment[]", roles: ["arzt", "pflege"], wireframe: "Termine" },
      { method: "POST", path: "/api/v1/patients/:pid/appointments", desc: "Termin anlegen", body: "{ typ, titel, beginn, ende, zugewiesen_an?, ort?, wiederholung?, notiz? }", response: "Appointment (201)", roles: ["arzt", "pflege", "admin"], wireframe: "Termine" },
      { method: "PUT", path: "/api/v1/patients/:pid/appointments/:id", desc: "Termin aktualisieren", body: "{ beginn?, ende?, status?, notiz? }", response: "Appointment (200)", roles: ["arzt", "pflege", "admin"], wireframe: "Termine" },
      { method: "DELETE", path: "/api/v1/patients/:pid/appointments/:id", desc: "Termin löschen", params: ":id = Appointment UUID", response: "204 No Content", roles: ["arzt", "admin"], wireframe: "Termine" },
    ],
  },
  {
    id: "consent",
    label: "Einwilligungen",
    icon: "✅",
    color: "violet",
    base: "/api/v1/patients/:pid/consents",
    wireframe: "Rechtliche",
    desc: "nDSG Datenschutz-Einwilligungen",
    endpoints: [
      { method: "GET", path: "/api/v1/patients/:pid/consents", desc: "Alle Einwilligungen", params: ":pid = Patient UUID", response: "Consent[]", roles: ["arzt", "pflege", "admin"], wireframe: "Rechtliche" },
      { method: "POST", path: "/api/v1/patients/:pid/consents", desc: "Einwilligung erfassen", body: "{ typ, beschreibung, erteilt, erteilt_am?, dokument_ref? }", response: "Consent (201)", roles: ["arzt", "admin"], wireframe: "Rechtliche" },
      { method: "PATCH", path: "/api/v1/patients/:pid/consents/:id/revoke", desc: "Einwilligung widerrufen", body: "{ widerrufen_am }", response: "Consent (200)", roles: ["arzt", "admin"], wireframe: "Rechtliche" },
    ],
  },
  {
    id: "directives",
    label: "Verfügungen",
    icon: "⚖️",
    color: "violet",
    base: "/api/v1/patients/:pid/directives",
    wireframe: "Rechtliche",
    desc: "PV, Vorsorgeauftrag, Palliativ (ZGB 370–378)",
    endpoints: [
      { method: "GET", path: "/api/v1/patients/:pid/directives", desc: "Alle Verfügungen", params: "?typ=patientenverfuegung&status=aktiv", response: "AdvanceDirective[]", roles: ["arzt", "pflege"], wireframe: "Rechtliche" },
      { method: "GET", path: "/api/v1/patients/:pid/directives/:id", desc: "Einzelne Verfügung (Detail)", params: ":id = Directive UUID", response: "AdvanceDirective (mit Vertrauensperson)", roles: ["arzt", "pflege"], wireframe: "Rechtliche" },
      { method: "POST", path: "/api/v1/patients/:pid/directives", desc: "Verfügung erfassen", body: "{ typ, titel, inhalt?, reanimation?, beatmung?, kuenstliche_ernaehrung?, vertrauensperson_id?, gueltig_ab, ... }", response: "AdvanceDirective (201)", roles: ["arzt"], wireframe: "Rechtliche" },
      { method: "PUT", path: "/api/v1/patients/:pid/directives/:id", desc: "Verfügung aktualisieren", body: "{ inhalt?, reanimation?, status? }", response: "AdvanceDirective (200)", roles: ["arzt"], wireframe: "Rechtliche" },
    ],
  },
  {
    id: "users",
    label: "Benutzer",
    icon: "🔑",
    color: "slate",
    base: "/api/v1/users",
    wireframe: "System",
    desc: "Benutzerverwaltung (Keycloak-sync)",
    endpoints: [
      { method: "GET", path: "/api/v1/users/me", desc: "Eigenes Profil (aus JWT Token)", params: "Bearer Token", response: "AppUser", roles: ["arzt", "pflege", "admin"], wireframe: "Alle" },
      { method: "GET", path: "/api/v1/users", desc: "Alle Benutzer (für Zuweisungen)", params: "?rolle=arzt&ist_aktiv=true", response: "AppUser[]", roles: ["admin"], wireframe: "System" },
      { method: "POST", path: "/api/v1/users/sync", desc: "Keycloak → DB synchronisieren", body: "{}", response: "{ synced: number, created: number }", roles: ["admin"], wireframe: "System" },
    ],
  },
  {
    id: "audit",
    label: "Audit-Trail",
    icon: "📜",
    color: "slate",
    base: "/api/v1/audit",
    wireframe: "Compliance",
    desc: "Lückenloser Zugriffs-Log (nDSG / pgAudit)",
    endpoints: [
      { method: "GET", path: "/api/v1/audit", desc: "Audit-Log abfragen", params: "?tabelle=patient&datensatz_id=UUID&user_id=UUID&von=...&bis=...&limit=100", response: "AuditLog[] (paginiert)", roles: ["admin"], wireframe: "Compliance" },
      { method: "GET", path: "/api/v1/audit/patient/:pid", desc: "Alle Zugriffe auf einen Patienten", params: ":pid = Patient UUID", response: "AuditLog[]", roles: ["admin"], wireframe: "Compliance" },
      { method: "GET", path: "/api/v1/audit/stats", desc: "Zugriffs-Statistiken (Dashboard)", params: "?tage=30", response: "{ total: number, by_user: [...], by_table: [...] }", roles: ["admin"], wireframe: "Compliance" },
    ],
  },
  {
    id: "fhir",
    label: "FHIR R4",
    icon: "🔗",
    color: "slate",
    base: "/api/v1/fhir",
    wireframe: "Interoperabilität",
    desc: "FHIR R4 + CH Core Export-Endpoints",
    endpoints: [
      { method: "GET", path: "/api/v1/fhir/Patient/:fhir_id", desc: "Patient als FHIR Resource", params: ":fhir_id = FHIR Patient ID", response: "FHIR Patient Resource (JSON)", roles: ["arzt", "admin"], wireframe: "EPD Export" },
      { method: "GET", path: "/api/v1/fhir/Patient/:fhir_id/Observation", desc: "Vitaldaten als FHIR Observations", params: "?code=8867-4&date=ge2026-02-01", response: "FHIR Bundle (Observation[])", roles: ["arzt"], wireframe: "EPD Export" },
      { method: "GET", path: "/api/v1/fhir/Patient/:fhir_id/MedicationRequest", desc: "Medikamente als FHIR MedicationRequest", params: "?status=active", response: "FHIR Bundle (MedicationRequest[])", roles: ["arzt"], wireframe: "EPD Export" },
      { method: "GET", path: "/api/v1/fhir/Patient/:fhir_id/$everything", desc: "Komplettes Patientendossier (EPD-Export)", params: "?_since=2026-01-01", response: "FHIR Bundle (alle Ressourcen)", roles: ["arzt", "admin"], wireframe: "EPD Export" },
    ],
  },
  {
    id: "ws",
    label: "WebSocket",
    icon: "⚡",
    color: "rose",
    base: "ws://",
    wireframe: "Kurve / Dashboard",
    desc: "Echtzeit-Events für Vitaldaten & Alarme",
    endpoints: [
      { method: "WS", path: "ws://.../ws/vitals/:pid", desc: "Live Vitaldaten-Stream", params: "Upgrade: websocket, :pid = Patient UUID", response: "{ typ, wert, einheit, time } (kontinuierlich)", roles: ["arzt", "pflege"], wireframe: "Kurve" },
      { method: "WS", path: "ws://.../ws/alarms", desc: "Globaler Alarm-Stream", params: "Upgrade: websocket, Bearer Token", response: "{ alarm_id, patient_id, schwere, nachricht } (bei neuem Alarm)", roles: ["arzt", "pflege"], wireframe: "Dashboard" },
      { method: "WS", path: "ws://.../ws/alarms/:pid", desc: "Alarm-Stream für einen Patienten", params: "Upgrade: websocket, :pid = Patient UUID", response: "Alarm (bei neuem Alarm für diesen Patienten)", roles: ["arzt", "pflege"], wireframe: "Kurve" },
    ],
  },
];

// ─── HELPERS ────────────────────────────────────────

const METHOD_COLORS = {
  GET: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  POST: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  PUT: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  PATCH: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  DELETE: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  WS: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

const GROUP_COLORS = {
  cyan: { border: "border-cyan-500/30", bg: "bg-cyan-500/5", text: "text-cyan-400", dot: "bg-cyan-500", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  rose: { border: "border-rose-500/30", bg: "bg-rose-500/5", text: "text-rose-400", dot: "bg-rose-500", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  amber: { border: "border-amber-500/30", bg: "bg-amber-500/5", text: "text-amber-400", dot: "bg-amber-500", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-400", dot: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  violet: { border: "border-violet-500/30", bg: "bg-violet-500/5", text: "text-violet-400", dot: "bg-violet-500", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  slate: { border: "border-slate-500/30", bg: "bg-slate-500/5", text: "text-slate-400", dot: "bg-slate-500", badge: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

const ROLE_COLORS = {
  arzt: "bg-cyan-500/20 text-cyan-300",
  pflege: "bg-emerald-500/20 text-emerald-300",
  admin: "bg-amber-500/20 text-amber-300",
};

// ─── COMPONENTS ─────────────────────────────────────

function ApiStats() {
  const totalEndpoints = API_GROUPS.reduce((s, g) => s + g.endpoints.length, 0);
  const methods = {};
  API_GROUPS.forEach((g) => g.endpoints.forEach((e) => { methods[e.method] = (methods[e.method] || 0) + 1; }));
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
      <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-center col-span-2 sm:col-span-1">
        <div className="text-xl font-black text-cyan-400">{totalEndpoints}</div>
        <div className="text-xs text-slate-500">Endpoints</div>
      </div>
      {Object.entries(methods).map(([m, count]) => (
        <div key={m} className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-center">
          <div className="text-lg font-black text-white">{count}</div>
          <div className={`text-xs font-bold ${METHOD_COLORS[m]?.split(" ")[1] || "text-slate-500"}`}>{m}</div>
        </div>
      ))}
    </div>
  );
}

function GroupNav({ groups, active, onSelect, filter }) {
  const filtered = filter ? groups.filter((g) => g.endpoints.some((e) => e.method === filter)) : groups;
  return (
    <div className="space-y-1">
      {filtered.map((g) => {
        const gc = GROUP_COLORS[g.color];
        const isActive = active === g.id;
        const count = filter ? g.endpoints.filter((e) => e.method === filter).length : g.endpoints.length;
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className={`w-full text-left rounded-lg p-2.5 border transition-all ${
              isActive ? `${gc.bg} ${gc.border} ring-1 ${gc.border}` : "bg-slate-800/50 border-slate-700 hover:border-slate-500"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{g.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold truncate ${isActive ? gc.text : "text-slate-300"}`}>{g.label}</div>
                <div className="text-xs text-slate-500">{count} Endpoints</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EndpointCard({ ep, expanded, onToggle }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-3 hover:bg-slate-800/80 transition-colors">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-black px-2 py-0.5 rounded border ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
          <code className="text-sm text-slate-200 font-mono flex-1 min-w-0 truncate">{ep.path}</code>
          <div className="flex gap-1 flex-shrink-0">
            {ep.roles.map((r) => (
              <span key={r} className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS[r]}`}>{r}</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">{ep.desc}</p>
      </button>
      {expanded && (
        <div className="border-t border-slate-700 p-3 space-y-3 bg-slate-900/40">
          {ep.params && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Parameter</div>
              <code className="text-xs text-emerald-300 bg-slate-950 px-2 py-1 rounded block overflow-x-auto">{ep.params}</code>
            </div>
          )}
          {ep.body && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Request Body</div>
              <code className="text-xs text-cyan-300 bg-slate-950 px-2 py-1 rounded block overflow-x-auto">{ep.body}</code>
            </div>
          )}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Response</div>
            <code className="text-xs text-amber-300 bg-slate-950 px-2 py-1 rounded block overflow-x-auto">{ep.response}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Wireframe:</span>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{ep.wireframe}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupDetail({ group, methodFilter }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const gc = GROUP_COLORS[group.color];
  const endpoints = methodFilter ? group.endpoints.filter((e) => e.method === methodFilter) : group.endpoints;

  return (
    <div>
      {/* Group Header */}
      <div className={`rounded-xl ${gc.bg} border ${gc.border} p-4 mb-4`}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{group.icon}</span>
          <div>
            <h2 className="font-black text-white text-lg">{group.label}</h2>
            <p className="text-xs text-slate-400">{group.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>Base: <code className={`font-mono ${gc.text}`}>{group.base}</code></span>
          <span>·</span>
          <span>Wireframe: {group.wireframe}</span>
          <span>·</span>
          <span>{endpoints.length} Endpoints</span>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-2">
        {endpoints.map((ep, i) => (
          <EndpointCard
            key={i}
            ep={ep}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────

function PDMSApiCatalog() {
  const [activeGroup, setActiveGroup] = useState("patients");
  const [methodFilter, setMethodFilter] = useState(null);

  const group = API_GROUPS.find((g) => g.id === activeGroup);
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "WS"];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-8 rounded-full bg-cyan-500" />
            <div>
              <h1 className="text-lg font-black text-white">PDMS API-Katalog</h1>
              <p className="text-xs text-slate-500">FastAPI · REST + FHIR R4 + WebSocket · Alle Endpoints</p>
            </div>
            <div className="ml-auto flex gap-1.5">
              {["FastAPI", "OAuth 2.0", "FHIR R4", "WebSocket"].map((b) => (
                <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 hidden sm:inline-block">{b}</span>
              ))}
            </div>
          </div>
          {/* Method filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setMethodFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !methodFilter ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Alle
            </button>
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(methodFilter === m ? null : m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  methodFilter === m ? METHOD_COLORS[m] : "text-slate-500 border-transparent hover:text-slate-300"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <ApiStats />

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Nav */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
              <GroupNav groups={API_GROUPS} active={activeGroup} onSelect={setActiveGroup} filter={methodFilter} />
            </div>
          </div>

          {/* Right Detail */}
          <div className="flex-1 min-w-0">
            {group && <GroupDetail group={group} methodFilter={methodFilter} />}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 text-center">
        <p className="text-xs text-slate-700">PDMS Home-Spital · API-Katalog v1.0 · {API_GROUPS.reduce((s, g) => s + g.endpoints.length, 0)} Endpoints · {API_GROUPS.length} Gruppen · Stand Februar 2026</p>
      </div>
    </div>
  );
}

// ─── PDMS-RBAC-Matrix ───────────────────────────────────


// ─── RBAC DATA ──────────────────────────────────────

const ROLES = [
  {
    id: "arzt",
    label: "Arzt / Ärztin",
    icon: "👨‍⚕️",
    color: "cyan",
    keycloak: "realm-role: pdms_arzt",
    desc: "Voller klinischer Zugriff. Verordnet Medikamente, erstellt Diagnosen, gibt Einträge frei. Darf Patienten anlegen und Status ändern.",
    count: 0,
  },
  {
    id: "pflege",
    label: "Pflegefachperson",
    icon: "🩺",
    color: "emerald",
    keycloak: "realm-role: pdms_pflege",
    desc: "Dokumentiert Pflege, erfasst Vitaldaten, verabreicht Medikamente. Liest ärztliche Einträge, kann aber nicht verordnen.",
    count: 0,
  },
  {
    id: "admin",
    label: "Administrator",
    icon: "🔧",
    color: "amber",
    keycloak: "realm-role: pdms_admin",
    desc: "Verwaltet Benutzer, Versicherungen, Audit-Logs. Kein klinischer Schreibzugriff auf Dokumentation.",
    count: 0,
  },
];

// Permission levels: full = lesen+schreiben, read = nur lesen, none = kein Zugriff, own = nur eigene
const PERM = {
  full: { label: "Vollzugriff", short: "R/W", icon: "●", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  read: { label: "Nur lesen", short: "R", icon: "◐", color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
  own: { label: "Nur eigene", short: "Own", icon: "◑", color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/30" },
  none: { label: "Kein Zugriff", short: "—", icon: "○", color: "text-slate-600", bg: "bg-slate-500/5", border: "border-slate-700" },
  ack: { label: "Quittieren", short: "Ack", icon: "◉", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  exec: { label: "Ausführen", short: "Exec", icon: "⬤", color: "text-pink-400", bg: "bg-pink-500/15", border: "border-pink-500/30" },
};

const PERMISSION_GROUPS = [
  {
    id: "stammdaten",
    label: "Stammdaten",
    icon: "👤",
    wireframe: "Personalien / Dashboard",
    permissions: [
      { resource: "Patient anlegen", api: "POST /patients", arzt: "full", pflege: "none", admin: "full" },
      { resource: "Patient lesen", api: "GET /patients/:id", arzt: "full", pflege: "read", admin: "full" },
      { resource: "Patient bearbeiten", api: "PUT /patients/:id", arzt: "full", pflege: "full", admin: "full" },
      { resource: "Patient-Status ändern", api: "PATCH /patients/:id/status", arzt: "full", pflege: "none", admin: "none", note: "Nur Arzt darf entlassen" },
      { resource: "Patientenliste / Suche", api: "GET /patients", arzt: "full", pflege: "read", admin: "full" },
      { resource: "Dashboard-Summary", api: "GET /patients/:id/summary", arzt: "full", pflege: "read", admin: "none" },
    ],
  },
  {
    id: "versicherung",
    label: "Versicherung",
    icon: "🏥",
    wireframe: "Personalien",
    permissions: [
      { resource: "Versicherung lesen", api: "GET /patients/:pid/insurance", arzt: "read", pflege: "read", admin: "full" },
      { resource: "Versicherung anlegen", api: "POST /patients/:pid/insurance", arzt: "none", pflege: "none", admin: "full", note: "Nur Admin verwaltet Versicherungen" },
      { resource: "Versicherung bearbeiten", api: "PUT /patients/:pid/insurance/:id", arzt: "none", pflege: "none", admin: "full" },
      { resource: "Versicherung löschen", api: "DELETE /patients/:pid/insurance/:id", arzt: "none", pflege: "none", admin: "full" },
    ],
  },
  {
    id: "kontakte",
    label: "Notfallkontakte",
    icon: "📞",
    wireframe: "Personalien",
    permissions: [
      { resource: "Kontakte lesen", api: "GET /patients/:pid/contacts", arzt: "read", pflege: "read", admin: "full" },
      { resource: "Kontakt anlegen", api: "POST /patients/:pid/contacts", arzt: "full", pflege: "full", admin: "full" },
      { resource: "Kontakt bearbeiten", api: "PUT /patients/:pid/contacts/:id", arzt: "full", pflege: "full", admin: "full" },
      { resource: "Kontakt löschen", api: "DELETE /patients/:pid/contacts/:id", arzt: "full", pflege: "none", admin: "full" },
    ],
  },
  {
    id: "vitaldaten",
    label: "Vitaldaten",
    icon: "💓",
    wireframe: "Kurve",
    permissions: [
      { resource: "Vitaldaten lesen", api: "GET /patients/:pid/vitals", arzt: "full", pflege: "full", admin: "none" },
      { resource: "Letzte Werte", api: "GET /patients/:pid/vitals/latest", arzt: "full", pflege: "full", admin: "none" },
      { resource: "Messwert erfassen", api: "POST /patients/:pid/vitals", arzt: "full", pflege: "full", admin: "none" },
      { resource: "Batch-Import (Gerät)", api: "POST /patients/:pid/vitals/batch", arzt: "none", pflege: "full", admin: "none", note: "Pflege importiert Gerätedaten" },
      { resource: "Trend-Analyse", api: "GET /patients/:pid/vitals/trends", arzt: "full", pflege: "none", admin: "none", note: "Nur Arzt sieht Trends" },
      { resource: "Live-Stream (WebSocket)", api: "WS /ws/vitals/:pid", arzt: "full", pflege: "full", admin: "none" },
    ],
  },
  {
    id: "medikamente",
    label: "Medikamente",
    icon: "💊",
    wireframe: "Kurve / Arzt / Pflege",
    permissions: [
      { resource: "Medikamentenplan lesen", api: "GET /patients/:pid/medications", arzt: "full", pflege: "read", admin: "none" },
      { resource: "Medikament verordnen", api: "POST /patients/:pid/medications", arzt: "full", pflege: "none", admin: "none", note: "Nur Arzt verordnet" },
      { resource: "Verordnung ändern", api: "PUT /patients/:pid/medications/:id", arzt: "full", pflege: "none", admin: "none" },
      { resource: "Medikament absetzen", api: "PATCH /…/stop", arzt: "full", pflege: "none", admin: "none" },
      { resource: "Gabe dokumentieren", api: "POST /…/admin", arzt: "none", pflege: "full", admin: "none", note: "Nur Pflege dokumentiert Gabe" },
      { resource: "Gabe-Historie lesen", api: "GET /…/admin", arzt: "read", pflege: "read", admin: "none" },
    ],
  },
  {
    id: "alarme",
    label: "Alarme",
    icon: "🚨",
    wireframe: "Dashboard / Kurve",
    permissions: [
      { resource: "Alle offenen Alarme", api: "GET /alarms", arzt: "full", pflege: "read", admin: "none" },
      { resource: "Patienten-Alarme", api: "GET /patients/:pid/alarms", arzt: "full", pflege: "read", admin: "none" },
      { resource: "Alarm quittieren", api: "PATCH /…/ack", arzt: "ack", pflege: "ack", admin: "none" },
      { resource: "Alarm schliessen", api: "PATCH /…/close", arzt: "full", pflege: "none", admin: "none", note: "Nur Arzt schliesst Alarme" },
      { resource: "Alarm-Stream (WebSocket)", api: "WS /ws/alarms", arzt: "full", pflege: "full", admin: "none" },
    ],
  },
  {
    id: "arzt_doku",
    label: "Ärztl. Dokumentation",
    icon: "📝",
    wireframe: "Arzt",
    permissions: [
      { resource: "Einträge lesen", api: "GET /patients/:pid/notes", arzt: "full", pflege: "read", admin: "none", note: "Pflege liest, kann nicht schreiben" },
      { resource: "Eintrag erstellen", api: "POST /patients/:pid/notes", arzt: "full", pflege: "none", admin: "none" },
      { resource: "Eintrag bearbeiten", api: "PUT /patients/:pid/notes/:id", arzt: "own", pflege: "none", admin: "none", note: "Nur eigene Entwürfe" },
      { resource: "Eintrag freigeben", api: "PATCH /…/release", arzt: "own", pflege: "none", admin: "none", note: "Nur eigene Einträge freigeben" },
      { resource: "Gegenzeichnung", api: "PATCH /…/cosign", arzt: "full", pflege: "none", admin: "none", note: "4-Augen: anderer Arzt zeichnet gegen" },
    ],
  },
  {
    id: "pflege_doku",
    label: "Pflege-Dokumentation",
    icon: "🩺",
    wireframe: "Pflege",
    permissions: [
      { resource: "Einträge lesen", api: "GET /patients/:pid/nursing", arzt: "read", pflege: "full", admin: "none", note: "Arzt liest Pflege-Einträge" },
      { resource: "Eintrag erstellen", api: "POST /patients/:pid/nursing", arzt: "none", pflege: "full", admin: "none" },
      { resource: "Eintrag bearbeiten", api: "PUT /patients/:pid/nursing/:id", arzt: "none", pflege: "own", admin: "none", note: "Nur eigene, < 24h" },
      { resource: "Übergabe generieren", api: "GET /…/handover", arzt: "none", pflege: "full", admin: "none" },
    ],
  },
  {
    id: "termine",
    label: "Termine",
    icon: "📅",
    wireframe: "Termine",
    permissions: [
      { resource: "Termine lesen (global)", api: "GET /appointments", arzt: "full", pflege: "full", admin: "full" },
      { resource: "Patienten-Termine", api: "GET /patients/:pid/appointments", arzt: "full", pflege: "read", admin: "full" },
      { resource: "Termin anlegen", api: "POST /patients/:pid/appointments", arzt: "full", pflege: "full", admin: "full" },
      { resource: "Termin bearbeiten", api: "PUT /patients/:pid/appointments/:id", arzt: "full", pflege: "full", admin: "full" },
      { resource: "Termin löschen", api: "DELETE /patients/:pid/appointments/:id", arzt: "full", pflege: "none", admin: "full" },
    ],
  },
  {
    id: "rechtlich",
    label: "Rechtlich",
    icon: "⚖️",
    wireframe: "Rechtliche",
    permissions: [
      { resource: "Einwilligungen lesen", api: "GET /patients/:pid/consents", arzt: "read", pflege: "read", admin: "full" },
      { resource: "Einwilligung erfassen", api: "POST /patients/:pid/consents", arzt: "full", pflege: "none", admin: "full" },
      { resource: "Einwilligung widerrufen", api: "PATCH /…/revoke", arzt: "full", pflege: "none", admin: "full", note: "Kritisch — Audit-Log Pflicht" },
      { resource: "Verfügungen lesen", api: "GET /patients/:pid/directives", arzt: "full", pflege: "read", admin: "none" },
      { resource: "Verfügung erfassen", api: "POST /patients/:pid/directives", arzt: "full", pflege: "none", admin: "none", note: "Nur Arzt dokumentiert PV/VA" },
      { resource: "Verfügung aktualisieren", api: "PUT /patients/:pid/directives/:id", arzt: "full", pflege: "none", admin: "none" },
    ],
  },
  {
    id: "system",
    label: "System & Audit",
    icon: "🔑",
    wireframe: "System / Compliance",
    permissions: [
      { resource: "Eigenes Profil", api: "GET /users/me", arzt: "full", pflege: "full", admin: "full" },
      { resource: "Benutzerliste", api: "GET /users", arzt: "none", pflege: "none", admin: "full" },
      { resource: "Keycloak-Sync", api: "POST /users/sync", arzt: "none", pflege: "none", admin: "exec" },
      { resource: "Audit-Log lesen", api: "GET /audit", arzt: "none", pflege: "none", admin: "full", note: "Nur Admin sieht den Audit-Trail" },
      { resource: "Patienten-Zugriffs-Log", api: "GET /audit/patient/:pid", arzt: "none", pflege: "none", admin: "full" },
      { resource: "Audit-Statistiken", api: "GET /audit/stats", arzt: "none", pflege: "none", admin: "full" },
    ],
  },
  {
    id: "fhir",
    label: "FHIR R4 Export",
    icon: "🔗",
    wireframe: "EPD / Interop",
    permissions: [
      { resource: "FHIR Patient lesen", api: "GET /fhir/Patient/:id", arzt: "full", pflege: "none", admin: "full" },
      { resource: "FHIR Observations", api: "GET /fhir/…/Observation", arzt: "full", pflege: "none", admin: "none" },
      { resource: "FHIR MedicationRequest", api: "GET /fhir/…/MedicationRequest", arzt: "full", pflege: "none", admin: "none" },
      { resource: "FHIR $everything (EPD)", api: "GET /fhir/…/$everything", arzt: "full", pflege: "none", admin: "full", note: "Vollexport für EPD-Anbindung" },
    ],
  },
];

// Calculate counts
ROLES.forEach((r) => {
  let count = 0;
  PERMISSION_GROUPS.forEach((g) => {
    g.permissions.forEach((p) => {
      if (p[r.id] !== "none") count++;
    });
  });
  r.count = count;
});

const KEYCLOAK_CONFIG = {
  realm: "pdms-home-spital",
  clients: [
    { name: "pdms-web", type: "public", desc: "Next.js 15 Frontend (PKCE Flow)" },
    { name: "pdms-api", type: "confidential", desc: "FastAPI Backend (Service Account)" },
  ],
  roles: [
    { name: "pdms_arzt", composite: false, desc: "Ärztlicher Vollzugriff" },
    { name: "pdms_pflege", composite: false, desc: "Pflege-Dokumentation + Vitaldaten" },
    { name: "pdms_admin", composite: false, desc: "Administration + Audit" },
  ],
  flows: [
    { name: "Login", flow: "Authorization Code + PKCE", desc: "Browser → Keycloak → Token → API" },
    { name: "Token Refresh", flow: "Refresh Token (offline_access)", desc: "Automatisches Token-Refresh" },
    { name: "API Auth", flow: "Bearer Token (JWT)", desc: "Frontend sendet JWT im Authorization Header" },
    { name: "MFA", flow: "TOTP (Google Authenticator)", desc: "Pflicht für alle Rollen" },
    { name: "Session", flow: "SSO Session (8h idle, 12h max)", desc: "Auto-Logout nach Inaktivität" },
  ],
  token_claims: [
    { claim: "sub", desc: "User UUID (= app_user.keycloak_id)", example: "550e8400-e29b-41d4-a716-446655440000" },
    { claim: "realm_access.roles", desc: "Array der Rollen", example: '["pdms_arzt"]' },
    { claim: "email", desc: "E-Mail des Benutzers", example: "dr.mueller@homespital.ch" },
    { claim: "given_name", desc: "Vorname", example: "Anna" },
    { claim: "family_name", desc: "Nachname", example: "Müller" },
    { claim: "gln", desc: "GLN-Nummer (Custom Claim, nur Ärzte)", example: "7601000000001" },
  ],
};

// ─── HELPERS ────────────────────────────────────────

const ROLE_STYLE = {
  arzt: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-500", header: "bg-cyan-500" },
  pflege: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500", header: "bg-emerald-500" },
  admin: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500", header: "bg-amber-500" },
};

// ─── COMPONENTS ─────────────────────────────────────

function PermBadge({ level, compact }) {
  const p = PERM[level];
  if (compact) {
    return (
      <div className={`w-full h-full flex items-center justify-center rounded ${p.bg} border ${p.border}`} title={p.label}>
        <span className={`text-sm ${p.color}`}>{p.icon}</span>
      </div>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${p.bg} ${p.border} ${p.color}`}>
      <span>{p.icon}</span> {p.label}
    </span>
  );
}

function RoleCard({ role }) {
  const s = ROLE_STYLE[role.id];
  const totalPerms = PERMISSION_GROUPS.reduce((sum, g) => sum + g.permissions.length, 0);
  const pct = Math.round((role.count / totalPerms) * 100);
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{role.icon}</span>
        <div className="flex-1">
          <h3 className="font-bold text-white text-sm">{role.label}</h3>
          <code className="text-xs text-slate-500">{role.keycloak}</code>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-3">{role.desc}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${s.dot} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-bold ${s.text}`}>{role.count}/{totalPerms}</span>
      </div>
      <div className="text-xs text-slate-500 mt-1">{pct}% der Ressourcen zugänglich</div>
    </div>
  );
}

function MatrixView({ groups, roleFilter }) {
  const [expandedGroup, setExpandedGroup] = useState(null);
  const filteredGroups = roleFilter
    ? groups.filter((g) => g.permissions.some((p) => p[roleFilter] !== "none"))
    : groups;

  return (
    <div className="space-y-2">
      {filteredGroups.map((g) => {
        const perms = roleFilter
          ? g.permissions.filter((p) => p[roleFilter] !== "none")
          : g.permissions;
        const isExpanded = expandedGroup === g.id;

        return (
          <div key={g.id} className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
            <button
              onClick={() => setExpandedGroup(isExpanded ? null : g.id)}
              className="w-full text-left p-3 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{g.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-white text-sm">{g.label}</span>
                  <span className="text-xs text-slate-500 ml-2">{perms.length} Berechtigungen · {g.wireframe}</span>
                </div>
                {/* Mini permission preview */}
                <div className="hidden sm:flex items-center gap-0.5">
                  {perms.slice(0, 6).map((p, i) => (
                    <div key={i} className="flex gap-px">
                      {(roleFilter ? [roleFilter] : ["arzt", "pflege", "admin"]).map((r) => (
                        <div key={r} className="w-3 h-3">
                          <PermBadge level={p[r]} compact />
                        </div>
                      ))}
                    </div>
                  ))}
                  {perms.length > 6 && <span className="text-xs text-slate-600 ml-1">+{perms.length - 6}</span>}
                </div>
                <span className="text-slate-500 text-sm">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-700">
                {/* Table header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <span className="flex-1">Ressource</span>
                  {(roleFilter ? [ROLES.find((r) => r.id === roleFilter)] : ROLES).map((r) => (
                    <span key={r.id} className={`w-20 text-center ${ROLE_STYLE[r.id].text}`}>{r.label.split(" ")[0]}</span>
                  ))}
                </div>
                {/* Rows */}
                {perms.map((p, i) => (
                  <div key={i} className={`flex items-center gap-2 px-4 py-2 border-t border-slate-800/50 ${i % 2 === 0 ? "bg-slate-900/30" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-300">{p.resource}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs text-slate-600 font-mono">{p.api}</code>
                        {p.note && <span className="text-xs text-amber-500/70">⚠ {p.note}</span>}
                      </div>
                    </div>
                    {(roleFilter ? [roleFilter] : ["arzt", "pflege", "admin"]).map((r) => (
                      <div key={r} className="w-20 flex justify-center">
                        <PermBadge level={p[r]} compact />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function KeycloakConfig() {
  const [tab, setTab] = useState("flows");
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
      <div className="p-4 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h3 className="font-bold text-white">Keycloak 24 Konfiguration</h3>
            <p className="text-xs text-slate-500">Realm: <code className="text-cyan-400">{KEYCLOAK_CONFIG.realm}</code></p>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: "flows", label: "Auth Flows" },
          { id: "clients", label: "Clients" },
          { id: "roles", label: "Realm Roles" },
          { id: "tokens", label: "JWT Claims" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              tab === t.id ? "text-cyan-400 border-b-2 border-cyan-500" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === "flows" && (
          <div className="space-y-2">
            {KEYCLOAK_CONFIG.flows.map((f, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-slate-800 p-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xs flex-shrink-0">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{f.name}</div>
                  <code className="text-xs text-cyan-400">{f.flow}</code>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "clients" && (
          <div className="space-y-2">
            {KEYCLOAK_CONFIG.clients.map((c, i) => (
              <div key={i} className="rounded-lg bg-slate-800 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-lg">{c.type === "public" ? "🌐" : "🔒"}</div>
                <div>
                  <code className="text-sm font-bold text-white">{c.name}</code>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${c.type === "public" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{c.type}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "roles" && (
          <div className="space-y-2">
            {KEYCLOAK_CONFIG.roles.map((r, i) => (
              <div key={i} className="rounded-lg bg-slate-800 p-3 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${ROLE_STYLE[r.name.replace("pdms_", "")]?.dot || "bg-slate-500"}`} />
                <code className="text-sm font-bold text-white">{r.name}</code>
                <span className="text-xs text-slate-500">{r.desc}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "tokens" && (
          <div className="space-y-1.5">
            {KEYCLOAK_CONFIG.token_claims.map((c, i) => (
              <div key={i} className="rounded-lg bg-slate-800 p-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <code className="text-xs font-bold text-cyan-400 w-40 flex-shrink-0">{c.claim}</code>
                <span className="text-xs text-slate-400 flex-1">{c.desc}</span>
                <code className="text-xs text-slate-600 bg-slate-900 px-2 py-0.5 rounded">{c.example}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(PERM).map(([key, p]) => (
        <div key={key} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${p.bg} ${p.border} ${p.color}`}>
          <span>{p.icon}</span>
          <span>{p.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────

function PDMSRbacMatrix() {
  const [section, setSection] = useState("matrix");
  const [roleFilter, setRoleFilter] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-8 rounded-full bg-cyan-500" />
            <div>
              <h1 className="text-lg font-black text-white">PDMS RBAC-Matrix</h1>
              <p className="text-xs text-slate-500">Keycloak 24 · 3 Rollen · Alle Berechtigungen pro Ressource</p>
            </div>
            <div className="ml-auto flex gap-1.5">
              {["Keycloak 24", "OAuth 2.0 + PKCE", "JWT", "MFA"].map((b) => (
                <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 hidden sm:inline-block">{b}</span>
              ))}
            </div>
          </div>
          {/* Section toggle */}
          <div className="flex gap-2">
            {[
              { id: "matrix", label: "Berechtigungs-Matrix", icon: "📊" },
              { id: "keycloak", label: "Keycloak Config", icon: "🔐" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  section === s.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="mr-1">{s.icon}</span>{s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {ROLES.map((r) => (
            <div key={r.id} onClick={() => setRoleFilter(roleFilter === r.id ? null : r.id)} className="cursor-pointer">
              <div className={`transition-all rounded-xl ${roleFilter === r.id ? "ring-2 ring-white/20" : roleFilter && roleFilter !== r.id ? "opacity-40" : ""}`}>
                <RoleCard role={r} />
              </div>
            </div>
          ))}
        </div>

        {roleFilter && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-slate-500">Gefiltert nach:</span>
            <span className={`text-xs font-bold px-2 py-1 rounded border ${ROLE_STYLE[roleFilter].bg} ${ROLE_STYLE[roleFilter].border} ${ROLE_STYLE[roleFilter].text}`}>
              {ROLES.find((r) => r.id === roleFilter)?.label}
            </span>
            <button onClick={() => setRoleFilter(null)} className="text-xs text-slate-500 hover:text-white ml-1">✕ Filter entfernen</button>
          </div>
        )}

        {section === "matrix" && (
          <>
            <Legend />
            <MatrixView groups={PERMISSION_GROUPS} roleFilter={roleFilter} />
          </>
        )}

        {section === "keycloak" && <KeycloakConfig />}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 text-center">
        <p className="text-xs text-slate-700">
          PDMS Home-Spital · RBAC-Matrix v1.0 · 3 Rollen · {PERMISSION_GROUPS.reduce((s, g) => s + g.permissions.length, 0)} Berechtigungen · {PERMISSION_GROUPS.length} Gruppen · Stand Februar 2026
        </p>
      </div>
    </div>
  );
}

// ─── PDMS-Monorepo-Struktur ───────────────────────────────────


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

function PDMSMonorepo() {
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

// ─── PDMS-Docker-Compose ───────────────────────────────────


// ─── DOCKER COMPOSE DATA ────────────────────────────

const COMPOSE_VERSION = "3.9";

const SERVICES = [
  {
    id: "postgres",
    name: "postgres",
    label: "PostgreSQL 16 + TimescaleDB",
    icon: "🗄️",
    color: "cyan",
    image: "timescale/timescaledb:latest-pg16",
    ports: ["5432:5432"],
    desc: "Primäre Datenbank mit TimescaleDB für Vitaldaten-Zeitreihen und pgAudit für Compliance-Logging.",
    category: "Datenbank",
    env: [
      { key: "POSTGRES_DB", value: "pdms", desc: "Datenbankname" },
      { key: "POSTGRES_USER", value: "pdms_user", desc: "Datenbank-Benutzer" },
      { key: "POSTGRES_PASSWORD", value: "${POSTGRES_PASSWORD:-pdms_secret_2026}", desc: "Passwort (aus .env)" },
      { key: "POSTGRES_INITDB_ARGS", value: "--auth-host=scram-sha-256", desc: "Sichere Auth-Methode" },
    ],
    volumes: [
      { host: "pgdata", container: "/var/lib/postgresql/data", desc: "Persistente Daten" },
      { host: "./postgres/init.sql", container: "/docker-entrypoint-initdb.d/01-init.sql", desc: "Extensions + Schema Setup" },
    ],
    healthcheck: {
      test: 'pg_isready -U pdms_user -d pdms',
      interval: "10s",
      timeout: "5s",
      retries: 5,
    },
    networks: ["pdms-net"],
    depends_on: [],
    notes: "TimescaleDB Extension wird via init.sql aktiviert. pgAudit ebenfalls.",
  },
  {
    id: "keycloak",
    name: "keycloak",
    label: "Keycloak 24",
    icon: "🔐",
    color: "red",
    image: "quay.io/keycloak/keycloak:24.0",
    ports: ["8080:8080"],
    desc: "Identity & Access Management — OAuth 2.0 + PKCE, MFA (TOTP), 3 Realm-Rollen, JWT mit Custom Claims.",
    category: "Auth",
    command: "start-dev --import-realm",
    env: [
      { key: "KC_DB", value: "postgres", desc: "PostgreSQL als Backend" },
      { key: "KC_DB_URL", value: "jdbc:postgresql://postgres:5432/keycloak", desc: "DB-Verbindung" },
      { key: "KC_DB_USERNAME", value: "pdms_user", desc: "DB-Benutzer" },
      { key: "KC_DB_PASSWORD", value: "${POSTGRES_PASSWORD:-pdms_secret_2026}", desc: "DB-Passwort" },
      { key: "KC_HOSTNAME", value: "localhost", desc: "Hostname für Tokens" },
      { key: "KC_HOSTNAME_PORT", value: "8080", desc: "Port" },
      { key: "KC_HTTP_ENABLED", value: "true", desc: "HTTP für Dev" },
      { key: "KC_HEALTH_ENABLED", value: "true", desc: "Health Endpoint" },
      { key: "KEYCLOAK_ADMIN", value: "admin", desc: "Admin-Benutzer" },
      { key: "KEYCLOAK_ADMIN_PASSWORD", value: "${KC_ADMIN_PASSWORD:-admin}", desc: "Admin-Passwort" },
    ],
    volumes: [
      { host: "./keycloak/realm-export.json", container: "/opt/keycloak/data/import/pdms-realm.json", desc: "Realm: 3 Rollen, 2 Clients, MFA" },
    ],
    healthcheck: {
      test: 'curl -fsS http://localhost:8080/health/ready || exit 1',
      interval: "15s",
      timeout: "5s",
      retries: 10,
      start_period: "30s",
    },
    networks: ["pdms-net"],
    depends_on: ["postgres"],
    notes: "Realm-Export enthält pdms_arzt, pdms_pflege, pdms_admin Rollen + pdms-web (public) und pdms-api (confidential) Clients.",
  },
  {
    id: "valkey",
    name: "valkey",
    label: "Valkey 9 (Redis-Fork)",
    icon: "⚡",
    color: "rose",
    image: "valkey/valkey:9-alpine",
    ports: ["6379:6379"],
    desc: "In-Memory Cache & Pub/Sub — Session-Cache, Rate-Limiting, WebSocket Pub/Sub für Echtzeit-Alarme.",
    category: "Cache",
    command: "valkey-server --save 60 1 --loglevel warning --maxmemory 128mb --maxmemory-policy allkeys-lru",
    env: [],
    volumes: [
      { host: "valkeydata", container: "/data", desc: "Persistenz (RDB Snapshots)" },
    ],
    healthcheck: {
      test: 'valkey-cli ping | grep -q PONG',
      interval: "10s",
      timeout: "3s",
      retries: 5,
    },
    networks: ["pdms-net"],
    depends_on: [],
    notes: "Valkey 9 ist der Community-Fork von Redis. 100% kompatibel mit Redis-Clients. Alpine-Image: nur ~30 MB.",
  },
  {
    id: "rabbitmq",
    name: "rabbitmq",
    label: "RabbitMQ 3.13",
    icon: "🐰",
    color: "amber",
    image: "rabbitmq:3.13-management-alpine",
    ports: ["5672:5672", "15672:15672"],
    desc: "Message Broker für Domain Events — VitalRecorded, AlarmTriggered, MedicationPrescribed. Management UI auf Port 15672.",
    category: "Messaging",
    env: [
      { key: "RABBITMQ_DEFAULT_USER", value: "pdms", desc: "Benutzer" },
      { key: "RABBITMQ_DEFAULT_PASS", value: "${RABBITMQ_PASSWORD:-pdms_rabbit_2026}", desc: "Passwort (aus .env)" },
      { key: "RABBITMQ_DEFAULT_VHOST", value: "pdms", desc: "Virtual Host" },
    ],
    volumes: [
      { host: "rabbitmqdata", container: "/var/lib/rabbitmq", desc: "Queue-Persistenz" },
    ],
    healthcheck: {
      test: 'rabbitmq-diagnostics -q check_running',
      interval: "15s",
      timeout: "10s",
      retries: 5,
      start_period: "20s",
    },
    networks: ["pdms-net"],
    depends_on: [],
    notes: "Management-Plugin (Port 15672) für Queue-Monitoring. Domain Events: vital.recorded, alarm.triggered, medication.prescribed.",
  },
  {
    id: "api",
    name: "api",
    label: "FastAPI Backend",
    icon: "🐍",
    color: "emerald",
    image: null,
    build: { context: "../apps/api", dockerfile: "Dockerfile" },
    ports: ["8000:8000"],
    desc: "REST + FHIR R4 + WebSocket API — 60 Endpoints, DDD-Architektur, Pydantic v2, SQLAlchemy 2.0.",
    category: "App",
    command: "uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload",
    env: [
      { key: "DATABASE_URL", value: "postgresql+asyncpg://pdms_user:${POSTGRES_PASSWORD:-pdms_secret_2026}@postgres:5432/pdms", desc: "Async DB-Verbindung" },
      { key: "KEYCLOAK_URL", value: "http://keycloak:8080", desc: "Keycloak (intern)" },
      { key: "KEYCLOAK_REALM", value: "pdms-home-spital", desc: "Realm-Name" },
      { key: "KEYCLOAK_CLIENT_ID", value: "pdms-api", desc: "Confidential Client" },
      { key: "KEYCLOAK_CLIENT_SECRET", value: "${KC_API_SECRET:-dev-secret}", desc: "Client Secret" },
      { key: "VALKEY_URL", value: "redis://valkey:6379/0", desc: "Valkey-Verbindung (redis:// Protokoll)" },
      { key: "RABBITMQ_URL", value: "amqp://pdms:${RABBITMQ_PASSWORD:-pdms_rabbit_2026}@rabbitmq:5672/pdms", desc: "RabbitMQ-Verbindung" },
      { key: "CORS_ORIGINS", value: '["http://localhost:3000"]', desc: "Erlaubte CORS Origins" },
      { key: "LOG_LEVEL", value: "DEBUG", desc: "Logging Level (Dev)" },
      { key: "ENVIRONMENT", value: "development", desc: "Umgebung" },
    ],
    volumes: [
      { host: "../apps/api/src", container: "/app/src", desc: "Hot-Reload (Source Code)" },
    ],
    healthcheck: {
      test: 'curl -fsS http://localhost:8000/health || exit 1',
      interval: "10s",
      timeout: "5s",
      retries: 5,
      start_period: "15s",
    },
    networks: ["pdms-net"],
    depends_on: ["postgres", "keycloak", "valkey", "rabbitmq"],
    notes: "Hot-Reload via Volume-Mount + --reload Flag. Wartet auf alle Infrastruktur-Services.",
  },
  {
    id: "web",
    name: "web",
    label: "Next.js 15 Frontend",
    icon: "⚛️",
    color: "violet",
    image: null,
    build: { context: "../apps/web", dockerfile: "Dockerfile.dev" },
    ports: ["3000:3000"],
    desc: "React 19 + Next.js 15 App Router — shadcn/ui, TanStack Query, nuqs URL-State, Tailwind CSS.",
    category: "App",
    command: "pnpm dev",
    env: [
      { key: "NEXT_PUBLIC_API_URL", value: "http://localhost:8000/api/v1", desc: "API Base URL (Browser)" },
      { key: "NEXT_PUBLIC_WS_URL", value: "ws://localhost:8000/ws", desc: "WebSocket URL (Browser)" },
      { key: "NEXT_PUBLIC_KC_URL", value: "http://localhost:8080", desc: "Keycloak URL (Browser)" },
      { key: "NEXT_PUBLIC_KC_REALM", value: "pdms-home-spital", desc: "Keycloak Realm" },
      { key: "NEXT_PUBLIC_KC_CLIENT", value: "pdms-web", desc: "Public Client (PKCE)" },
    ],
    volumes: [
      { host: "../apps/web/src", container: "/app/src", desc: "Hot-Reload (Source Code)" },
      { host: "../apps/web/public", container: "/app/public", desc: "Statische Assets" },
    ],
    healthcheck: {
      test: 'curl -fsS http://localhost:3000 || exit 1',
      interval: "10s",
      timeout: "5s",
      retries: 5,
      start_period: "20s",
    },
    networks: ["pdms-net"],
    depends_on: ["api"],
    notes: "Turbopack für schnelleren Dev-Server. NEXT_PUBLIC_ Variablen sind im Browser sichtbar.",
  },
  {
    id: "nginx",
    name: "nginx",
    label: "Nginx Reverse Proxy",
    icon: "🌐",
    color: "slate",
    image: "nginx:1.27-alpine",
    ports: ["80:80", "443:443"],
    desc: "Reverse Proxy — Routing: / → Web, /api → FastAPI, /auth → Keycloak. TLS mit mkcert (dev) / Let's Encrypt (prod).",
    category: "Proxy",
    env: [],
    volumes: [
      { host: "./nginx/nginx.conf", container: "/etc/nginx/nginx.conf:ro", desc: "Nginx Config" },
      { host: "./nginx/ssl", container: "/etc/nginx/ssl:ro", desc: "TLS-Zertifikate" },
    ],
    healthcheck: {
      test: 'curl -fsS http://localhost/health || exit 1',
      interval: "10s",
      timeout: "3s",
      retries: 5,
    },
    networks: ["pdms-net"],
    depends_on: ["web", "api", "keycloak"],
    notes: "Optional für Dev (direkt via Ports möglich). Pflicht für Staging/Prod.",
  },
];

const VOLUMES = [
  { name: "pgdata", desc: "PostgreSQL Daten (Patientendaten, Audit-Logs)", size: "~500 MB–5 GB" },
  { name: "valkeydata", desc: "Valkey RDB Snapshots (Sessions, Cache)", size: "~10–50 MB" },
  { name: "rabbitmqdata", desc: "RabbitMQ Queue-Daten (Domain Events)", size: "~10–100 MB" },
];

const NETWORKS = [
  { name: "pdms-net", driver: "bridge", desc: "Internes Netzwerk — alle Services kommunizieren hier" },
];

const INIT_SQL = `-- PostgreSQL Init Script (docker/postgres/init.sql)
-- Wird beim ersten Start automatisch ausgeführt

-- 1. Keycloak-Datenbank
CREATE DATABASE keycloak;

-- 2. Extensions für PDMS
\\c pdms;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgaudit;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- Volltextsuche

-- 3. pgAudit Konfiguration
ALTER SYSTEM SET pgaudit.log = 'write, ddl';
ALTER SYSTEM SET pgaudit.log_catalog = 'off';
ALTER SYSTEM SET pgaudit.log_parameter = 'on';
SELECT pg_reload_conf();

-- 4. TimescaleDB Hypertable (nach Alembic Migration)
-- CREATE TABLE vital_sign (...);
-- SELECT create_hypertable('vital_sign', 'time');`;

const NGINX_CONF = `# Nginx Config (docker/nginx/nginx.conf)
events { worker_connections 1024; }

http {
  upstream web    { server web:3000; }
  upstream api    { server api:8000; }
  upstream auth   { server keycloak:8080; }

  server {
    listen 80;
    server_name localhost;
    # Redirect zu HTTPS in Prod
    # return 301 https://\\$host\\$request_uri;

    # Health Check
    location /health { return 200 'ok'; }

    # Frontend (Next.js)
    location / {
      proxy_pass http://web;
      proxy_http_version 1.1;
      proxy_set_header Upgrade \\$http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    # API (FastAPI)
    location /api/ {
      proxy_pass http://api;
      proxy_set_header X-Real-IP \\$remote_addr;
      proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
    }

    # WebSocket (Vitals + Alarms)
    location /ws/ {
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Upgrade \\$http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_read_timeout 86400;
    }

    # Keycloak (Auth)
    location /auth/ {
      proxy_pass http://auth;
      proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \\$scheme;
    }
  }
}`;

const ENV_EXAMPLE = `# .env.example — Umgebungsvariablen für Docker Compose
# Kopiere zu .env und passe Werte an

# ─── PostgreSQL ───────────────────
POSTGRES_PASSWORD=pdms_secret_2026

# ─── Keycloak ─────────────────────
KC_ADMIN_PASSWORD=admin
KC_API_SECRET=dev-secret

# ─── RabbitMQ ─────────────────────
RABBITMQ_PASSWORD=pdms_rabbit_2026

# ─── App Settings ─────────────────
LOG_LEVEL=DEBUG
ENVIRONMENT=development`;

const DOCKER_COMPOSE_YAML = `# docker/docker-compose.yml
# PDMS Home-Spital — Development Stack
# Start: docker compose up -d

version: "${COMPOSE_VERSION}"

services:
  # ─── DATENBANK ────────────────────────
  postgres:
    image: timescale/timescaledb:latest-pg16
    container_name: pdms-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: pdms
      POSTGRES_USER: pdms_user
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-pdms_secret_2026}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/01-init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pdms_user -d pdms"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pdms-net

  # ─── AUTH ─────────────────────────────
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: pdms-keycloak
    restart: unless-stopped
    command: start-dev --import-realm
    ports:
      - "8080:8080"
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: pdms_user
      KC_DB_PASSWORD: \${POSTGRES_PASSWORD:-pdms_secret_2026}
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 8080
      KC_HTTP_ENABLED: true
      KC_HEALTH_ENABLED: true
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: \${KC_ADMIN_PASSWORD:-admin}
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/pdms-realm.json
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:8080/health/ready || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 10
      start_period: 30s
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - pdms-net

  # ─── CACHE ───────────────────────────
  valkey:
    image: valkey/valkey:9-alpine
    container_name: pdms-valkey
    restart: unless-stopped
    command: >
      valkey-server
        --save 60 1
        --loglevel warning
        --maxmemory 128mb
        --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - valkeydata:/data
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - pdms-net

  # ─── MESSAGING ───────────────────────
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: pdms-rabbitmq
    restart: unless-stopped
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: pdms
      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASSWORD:-pdms_rabbit_2026}
      RABBITMQ_DEFAULT_VHOST: pdms
    volumes:
      - rabbitmqdata:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "check_running"]
      interval: 15s
      timeout: 10s
      retries: 5
      start_period: 20s
    networks:
      - pdms-net

  # ─── BACKEND ─────────────────────────
  api:
    build:
      context: ../apps/api
      dockerfile: Dockerfile
    container_name: pdms-api
    restart: unless-stopped
    command: >
      uvicorn src.main:app
        --host 0.0.0.0
        --port 8000
        --reload
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://pdms_user:\${POSTGRES_PASSWORD:-pdms_secret_2026}@postgres:5432/pdms
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: pdms-home-spital
      KEYCLOAK_CLIENT_ID: pdms-api
      KEYCLOAK_CLIENT_SECRET: \${KC_API_SECRET:-dev-secret}
      VALKEY_URL: redis://valkey:6379/0
      RABBITMQ_URL: amqp://pdms:\${RABBITMQ_PASSWORD:-pdms_rabbit_2026}@rabbitmq:5672/pdms
      CORS_ORIGINS: '["http://localhost:3000"]'
      LOG_LEVEL: DEBUG
      ENVIRONMENT: development
    volumes:
      - ../apps/api/src:/app/src
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:8000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    depends_on:
      postgres:
        condition: service_healthy
      keycloak:
        condition: service_healthy
      valkey:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - pdms-net

  # ─── FRONTEND ────────────────────────
  web:
    build:
      context: ../apps/web
      dockerfile: Dockerfile.dev
    container_name: pdms-web
    restart: unless-stopped
    command: pnpm dev
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
      NEXT_PUBLIC_WS_URL: ws://localhost:8000/ws
      NEXT_PUBLIC_KC_URL: http://localhost:8080
      NEXT_PUBLIC_KC_REALM: pdms-home-spital
      NEXT_PUBLIC_KC_CLIENT: pdms-web
    volumes:
      - ../apps/web/src:/app/src
      - ../apps/web/public:/app/public
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:3000 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    depends_on:
      api:
        condition: service_healthy
    networks:
      - pdms-net

  # ─── REVERSE PROXY ──────────────────
  nginx:
    image: nginx:1.27-alpine
    container_name: pdms-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost/health || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 5
    depends_on:
      - web
      - api
      - keycloak
    networks:
      - pdms-net

# ─── VOLUMES ───────────────────────────
volumes:
  pgdata:
    driver: local
  valkeydata:
    driver: local
  rabbitmqdata:
    driver: local

# ─── NETWORKS ──────────────────────────
networks:
  pdms-net:
    driver: bridge`;

// ─── HELPERS ────────────────────────────────────────

const COLOR_MAP = {
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-500", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500", badge: "bg-red-500/20 text-red-300 border-red-500/30" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-500", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", dot: "bg-violet-500", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  slate: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-400", dot: "bg-slate-500", badge: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

// ─── COMPONENTS ─────────────────────────────────────

function ServiceCard({ service, isActive, onClick }) {
  const c = COLOR_MAP[service.color];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all ${
        isActive ? `${c.bg} ${c.border} ring-1 ${c.border}` : "bg-slate-800/40 border-slate-700 hover:border-slate-500"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{service.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold truncate ${isActive ? c.text : "text-slate-300"}`}>{service.label}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-600">{service.category}</span>
            <span className="text-xs text-slate-700">·</span>
            <span className="text-xs text-slate-600">{service.ports?.[0]}</span>
          </div>
        </div>
        {service.depends_on.length > 0 && (
          <span className="text-xs text-slate-600 bg-slate-800 rounded px-1.5 py-0.5">{service.depends_on.length} deps</span>
        )}
      </div>
    </button>
  );
}

function ServiceDetail({ service }) {
  const [tab, setTab] = useState("overview");
  const c = COLOR_MAP[service.color];

  return (
    <div>
      {/* Header */}
      <div className={`rounded-xl ${c.bg} border ${c.border} p-4 mb-4`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{service.icon}</span>
          <div>
            <h2 className="font-black text-white text-lg">{service.label}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <code className={c.text}>{service.image || `build: ${service.build?.context}`}</code>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">{service.desc}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {service.ports?.map((p) => (
            <span key={p} className={`text-xs px-2 py-0.5 rounded border ${c.badge}`}>:{p.split(":")[0]}</span>
          ))}
          {service.depends_on.map((d) => (
            <span key={d} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">→ {d}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {[
          { id: "overview", label: "Übersicht" },
          ...(service.env.length > 0 ? [{ id: "env", label: `Env (${service.env.length})` }] : []),
          { id: "volumes", label: `Volumes (${service.volumes?.length || 0})` },
          { id: "health", label: "Healthcheck" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && (
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-800 border border-slate-700 p-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Container</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">Name:</span> <code className="text-cyan-400">pdms-{service.name}</code></div>
              <div><span className="text-slate-500">Image:</span> <code className="text-emerald-400">{service.image || "Dockerfile"}</code></div>
              <div><span className="text-slate-500">Ports:</span> <code className="text-amber-400">{service.ports?.join(", ") || "—"}</code></div>
              <div><span className="text-slate-500">Network:</span> <code className="text-violet-400">pdms-net</code></div>
            </div>
            {service.command && (
              <div className="mt-2">
                <span className="text-xs text-slate-500">Command:</span>
                <code className="text-xs text-cyan-300 bg-slate-950 px-2 py-1 rounded block mt-1 overflow-x-auto">{service.command}</code>
              </div>
            )}
          </div>
          {service.notes && (
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-300/80">
              💡 {service.notes}
            </div>
          )}
        </div>
      )}

      {tab === "env" && (
        <div className="space-y-1.5">
          {service.env.map((e, i) => (
            <div key={i} className="rounded-lg bg-slate-800 border border-slate-700 p-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <code className="text-xs font-bold text-emerald-400 min-w-48 flex-shrink-0">{e.key}</code>
              <code className="text-xs text-slate-300 flex-1 overflow-x-auto bg-slate-950 px-2 py-0.5 rounded">{e.value}</code>
              <span className="text-xs text-slate-500 flex-shrink-0">{e.desc}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "volumes" && (
        <div className="space-y-1.5">
          {(service.volumes || []).map((v, i) => (
            <div key={i} className="rounded-lg bg-slate-800 border border-slate-700 p-3">
              <div className="flex items-center gap-2 text-sm">
                <code className="text-cyan-400 text-xs">{v.host}</code>
                <span className="text-slate-600">→</span>
                <code className="text-emerald-400 text-xs">{v.container}</code>
              </div>
              <p className="text-xs text-slate-500 mt-1">{v.desc}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "health" && service.healthcheck && (
        <div className="rounded-lg bg-slate-800 border border-slate-700 p-3 space-y-2">
          <div>
            <span className="text-xs text-slate-500">Test:</span>
            <code className="text-xs text-cyan-300 bg-slate-950 px-2 py-1 rounded block mt-1">{service.healthcheck.test}</code>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div><span className="text-xs text-slate-500">Interval:</span> <span className="text-xs text-white">{service.healthcheck.interval}</span></div>
            <div><span className="text-xs text-slate-500">Timeout:</span> <span className="text-xs text-white">{service.healthcheck.timeout}</span></div>
            <div><span className="text-xs text-slate-500">Retries:</span> <span className="text-xs text-white">{service.healthcheck.retries}</span></div>
            {service.healthcheck.start_period && (
              <div><span className="text-xs text-slate-500">Start:</span> <span className="text-xs text-white">{service.healthcheck.start_period}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ArchDiagram() {
  const layers = [
    { label: "Browser", items: ["http://localhost:80"], color: "slate" },
    { label: "Nginx Reverse Proxy", items: ["/ → :3000", "/api → :8000", "/ws → :8000", "/auth → :8080"], color: "slate" },
    { label: "Apps", items: ["Next.js 15 (:3000)", "FastAPI (:8000)"], color: "violet" },
    { label: "Infra", items: ["PostgreSQL+TimescaleDB (:5432)", "Keycloak 24 (:8080)", "Valkey 9 (:6379)", "RabbitMQ (:5672)"], color: "cyan" },
    { label: "Volumes", items: ["pgdata", "valkeydata", "rabbitmqdata"], color: "amber" },
  ];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="font-bold text-white text-sm mb-4">Architektur — Netzwerk-Topologie</h3>
      <div className="space-y-2">
        {layers.map((l, i) => {
          const c = COLOR_MAP[l.color];
          return (
            <div key={i}>
              <div className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
                <div className={`text-xs font-bold ${c.text} uppercase tracking-wide mb-2`}>{l.label}</div>
                <div className="flex flex-wrap gap-2">
                  {l.items.map((item, j) => (
                    <span key={j} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 font-mono">{item}</span>
                  ))}
                </div>
              </div>
              {i < layers.length - 1 && (
                <div className="flex justify-center py-1">
                  <span className="text-slate-600 text-sm">↕</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg bg-slate-800 border border-slate-700 p-3">
        <div className="text-xs font-bold text-slate-500 mb-2">Docker Network: pdms-net (bridge)</div>
        <p className="text-xs text-slate-500">Alle Services kommunizieren über das interne pdms-net. Nur die definierten Ports sind nach aussen erreichbar.</p>
      </div>
    </div>
  );
}

function CodeView({ title, code, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <span className="text-sm font-bold text-white">{title}</span>
        <button
          onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded bg-slate-700"
        >
          {copied ? "✓ Kopiert" : "Kopieren"}
        </button>
      </div>
      <pre className="p-4 text-xs text-slate-300 overflow-x-auto leading-relaxed font-mono" style={{ maxHeight: "500px" }}>
        {code}
      </pre>
    </div>
  );
}

function ResourceStats() {
  const resources = [
    { name: "PostgreSQL + TimescaleDB", ram: "256 MB", cpu: "Gering", disk: "~500 MB" },
    { name: "Keycloak 24 (JVM)", ram: "512 MB", cpu: "Mittel", disk: "~200 MB" },
    { name: "Valkey 9", ram: "128 MB", cpu: "Minimal", disk: "~10 MB" },
    { name: "RabbitMQ", ram: "256 MB", cpu: "Gering", disk: "~100 MB" },
    { name: "FastAPI (Python)", ram: "128 MB", cpu: "Gering", disk: "~150 MB" },
    { name: "Next.js 15 (Node)", ram: "256 MB", cpu: "Mittel", disk: "~300 MB" },
    { name: "Nginx", ram: "16 MB", cpu: "Minimal", disk: "~20 MB" },
  ];
  const totalRam = "~1.5 GB";

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="font-bold text-white text-sm mb-3">💻 Ressourcen-Verbrauch (Dev)</h3>
      <div className="space-y-1">
        {resources.map((r, i) => (
          <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-slate-800 last:border-0">
            <span className="text-slate-300 flex-1">{r.name}</span>
            <span className="text-cyan-400 w-16 text-right">{r.ram}</span>
            <span className="text-amber-400 w-14 text-right">{r.cpu}</span>
            <span className="text-slate-500 w-16 text-right">{r.disk}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 text-xs pt-2 font-bold">
          <span className="text-white flex-1">Total</span>
          <span className="text-cyan-400 w-16 text-right">{totalRam}</span>
          <span className="text-amber-400 w-14 text-right">—</span>
          <span className="text-slate-400 w-16 text-right">~1.3 GB</span>
        </div>
      </div>
      <p className="text-xs text-slate-600 mt-2">Empfehlung: MacBook mit mind. 8 GB RAM oder Linux mit 4 GB + Swap.</p>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────

function PDMSDockerCompose() {
  const [activeService, setActiveService] = useState("postgres");
  const [view, setView] = useState("services");

  const service = SERVICES.find((s) => s.id === activeService);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-8 rounded-full bg-cyan-500" />
            <div>
              <h1 className="text-lg font-black text-white">PDMS Docker Compose</h1>
              <p className="text-xs text-slate-500">7 Services · Dev-Umgebung komplett · docker compose up -d</p>
            </div>
            <div className="ml-auto flex gap-1.5">
              {["7 Services", "3 Volumes", "1 Network", "~1.5 GB RAM"].map((b) => (
                <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 hidden sm:inline-block">{b}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "services", label: "Services", icon: "🐳" },
              { id: "yaml", label: "docker-compose.yml", icon: "📄" },
              { id: "init", label: "init.sql", icon: "🗄️" },
              { id: "nginx", label: "nginx.conf", icon: "🌐" },
              { id: "env", label: ".env.example", icon: "🔑" },
              { id: "arch", label: "Architektur", icon: "🏗️" },
              { id: "resources", label: "Ressourcen", icon: "💻" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  view === t.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="mr-1">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {view === "services" && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-64 flex-shrink-0 space-y-1.5">
              {SERVICES.map((s) => (
                <ServiceCard key={s.id} service={s} isActive={activeService === s.id} onClick={() => setActiveService(s.id)} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              {service && <ServiceDetail service={service} />}
            </div>
          </div>
        )}

        {view === "yaml" && <CodeView title="docker/docker-compose.yml" code={DOCKER_COMPOSE_YAML} lang="yaml" />}
        {view === "init" && <CodeView title="docker/postgres/init.sql" code={INIT_SQL} lang="sql" />}
        {view === "nginx" && <CodeView title="docker/nginx/nginx.conf" code={NGINX_CONF} lang="nginx" />}
        {view === "env" && <CodeView title=".env.example" code={ENV_EXAMPLE} lang="bash" />}
        {view === "arch" && <ArchDiagram />}
        {view === "resources" && <ResourceStats />}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 text-center">
        <p className="text-xs text-slate-700">PDMS Home-Spital · Docker Compose v1.0 · 7 Services · Stand Februar 2026</p>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// MASTER COMPONENT — Navigation zwischen allen 5 Modulen
// ═══════════════════════════════════════════════════════════════

const MODULES = [
  { id: "schema", label: "Datenbank-Schema", icon: "🗄️", desc: "14 Tabellen, ERD, SQL DDL", component: PDMSDatabaseSchema },
  { id: "api", label: "API-Katalog", icon: "🔌", desc: "60 REST + FHIR + WebSocket Endpoints", component: PDMSApiCatalog },
  { id: "rbac", label: "RBAC-Matrix", icon: "🔐", desc: "3 Rollen, 63 Berechtigungen, Keycloak", component: PDMSRbacMatrix },
  { id: "monorepo", label: "Monorepo-Struktur", icon: "🌳", desc: "Verzeichnisbaum, Dependencies, Quick Start", component: PDMSMonorepo },
  { id: "docker", label: "Docker Compose", icon: "🐳", desc: "7 Services, Configs, Architektur", component: PDMSDockerCompose },
];

export default function PDMSKomplettDoku() {
  const [activeModule, setActiveModule] = useState("schema");
  const current = MODULES.find((m) => m.id === activeModule);
  const ActiveComponent = current?.component;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Master Navigation */}
      <div className="sticky top-0 z-50 bg-slate-950 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm">P</div>
              <div>
                <h1 className="text-sm font-black text-white leading-none">PDMS Home-Spital</h1>
                <p className="text-xs text-slate-500">Komplette Planungs-Dokumentation · 5 Module</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {MODULES.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeModule === m.id
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="text-sm">{m.icon}</span>
                <span>{m.label}</span>
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                  activeModule === m.id ? "bg-cyan-500 text-slate-950" : "bg-slate-700 text-slate-400"
                }`}>{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Module */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
