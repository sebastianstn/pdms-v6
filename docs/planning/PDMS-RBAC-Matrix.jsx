import { useState } from "react";

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

export default function PDMSRbacMatrix() {
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
