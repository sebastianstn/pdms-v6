import { useState } from "react";

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

function Stats() {
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

export default function PDMSApiCatalog() {
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
        <Stats />

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
