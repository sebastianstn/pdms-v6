import { useState } from "react";

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

function Stats() {
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

export default function PDMSDatabaseSchema() {
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
        <Stats />

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
