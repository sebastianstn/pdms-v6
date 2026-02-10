import { useState } from "react";

// ─── DATA ───────────────────────────────────────────

const VISION = {
  title: "Was ist das PDMS Home-Spital?",
  desc: "Ein Patient Data Management System für die ambulante Spitalversorgung (Hospital at Home) in der Schweiz. Patienten werden zuhause betreut — mit klinischer Dokumentation, Vitaldaten-Monitoring und Medikamentenmanagement auf Spitalniveau.",
  targets: "Ärztinnen, Pflegefachpersonen und Administratoren im Home-Spital-Setting",
  regs: "nDSG (CH-Datenschutz), EPDG (Elektronisches Patientendossier), IEC 62304 (Medizinprodukt-Software), ZGB 370-378 (Patientenverfügung)",
  facts: [
    { label: "Typ", value: "Hospital at Home", icon: "🏠" },
    { label: "Seiten", value: "7 Tabs (Dashboard + 6)", icon: "📄" },
    { label: "Rollen", value: "Arzt · Pflege · Admin", icon: "👥" },
    { label: "Region", value: "Schweiz (FR/DE)", icon: "🇨🇭" },
    { label: "Standard", value: "FHIR R4 + CH Core", icon: "🔗" },
    { label: "Klasse", value: "IEC 62304 (Medizinprodukt)", icon: "🏥" },
  ],
};

const STACK_GROUPS = [
  {
    title: "FRONTEND", color: "cyan", items: [
      "React 19", "TypeScript (strict)", "Next.js 15 (App Router)",
      "shadcn/ui + Tailwind CSS", "TanStack Query", "Zod v4 Validation",
      "nuqs (URL State)",
    ],
  },
  {
    title: "BACKEND", color: "emerald", items: [
      "Python 3.12", "FastAPI", "Pydantic v2",
      "SQLAlchemy 2.0", "Celery Workers", "DDD Architecture",
    ],
  },
  {
    title: "DATEN & INFRA", color: "violet", items: [
      "PostgreSQL 16", "TimescaleDB", "pgAudit",
      "RabbitMQ", "Valkey 9 (Redis-Fork)", "Keycloak 24",
    ],
  },
  {
    title: "MONITORING", color: "amber", items: [
      "Prometheus", "Grafana", "Loki",
      "Docker Compose", "Nginx (Reverse Proxy)", "GitHub Actions CI",
    ],
  },
];

const WIREFRAMES = [
  { name: "Dashboard", desc: "Patientenübersicht mit Sidebar", comps: 12, complexity: "Mittel", color: "cyan" },
  { name: "Personalien", desc: "7 Karten, 3-Spalten Layout", comps: 28, complexity: "Niedrig", color: "emerald" },
  { name: "Kurve", desc: "Vitalkurve 24h + Echtzeit", comps: 18, complexity: "Sehr hoch", color: "rose" },
  { name: "Arzt", desc: "Ärztliche Dokumentation", comps: 15, complexity: "Hoch", color: "amber" },
  { name: "Pflege", desc: "Pflege-Schichtprotokoll", comps: 15, complexity: "Hoch", color: "amber" },
  { name: "Termine", desc: "Wochenkalender", comps: 10, complexity: "Mittel", color: "cyan" },
  { name: "Rechtliche", desc: "PV, VA, Palliativ (erweitert)", comps: 20, complexity: "Mittel", color: "cyan" },
];

const LAYERS = [
  { name: "Presentation", tech: "React 19 + Next.js 15 + shadcn/ui", items: "Dashboard · Patientenkurve · Medikamentenplan · Alarm-Anzeige · nuqs URL-State", color: "bg-cyan-500" },
  { name: "API Gateway", tech: "Nginx + TLS 1.3", items: "Rate Limiting · Auth Token Validation · CORS · Logging", color: "bg-amber-500" },
  { name: "Application", tech: "FastAPI + Celery Workers", items: "REST/FHIR API · Audit Middleware · Business Logic · WebSocket", color: "bg-emerald-500" },
  { name: "Auth & Identity", tech: "Keycloak 24 + RBAC", items: "OAuth 2.0 · Rollen (Arzt/Pflege/Admin) · MFA · Session Mgmt", color: "bg-orange-500" },
  { name: "Message Layer", tech: "RabbitMQ + Valkey 9", items: "Device Messages · Alarms · Event Bus · Task Queue", color: "bg-violet-500" },
  { name: "Data Layer", tech: "PostgreSQL 16 + TimescaleDB + pgAudit", items: "Patient Records · Zeitreihen · Audit Logs · FHIR Resources", color: "bg-indigo-500" },
];

const COMPLIANCE = [
  { reg: "nDSG Art. 5c/6", desc: "Datenschutz für besonders schützenswerte Gesundheitsdaten", impl: "Einwilligung, Datenschutz-Karte im Dossier, DSFA", icon: "🔒" },
  { reg: "EPDG Art. 9", desc: "Elektronisches Patientendossier — Zugriffskontrolle", impl: "EPD-Status Badge, CARA-Integration, FHIR R4 Export", icon: "📋" },
  { reg: "IEC 62304", desc: "Software-Lebenszyklus für Medizinprodukte", impl: "SVG = Spec, Visual Regression Tests, Versions-Tracking", icon: "⚕️" },
  { reg: "ZGB 370-378", desc: "Patientenverfügung & Vorsorgeauftrag", impl: "Rechtliche-Tab: PV, VA, therapeut. Wünsche, Palliativ", icon: "⚖️" },
  { reg: "pgAudit", desc: "Lückenloser Audit-Trail", impl: "Jeder DB-Zugriff protokolliert: wer, wann, was", icon: "📜" },
  { reg: "FHIR R4 + CH Core", desc: "Interoperabilität & Datenaustausch", impl: "FHIR-ID auf jeder Seite, Patient-Ressource, Observation", icon: "🔗" },
];

const TIMELINE = [
  { weeks: "W 1–2", title: "Setup & Foundation", tasks: "Monorepo, Docker Compose, React 19 + Next.js 15, Shared Components, Layouts, Routing, nuqs", result: "Leere Shell mit Tab-Navigation", color: "bg-cyan-500", ring: "ring-cyan-500/30" },
  { weeks: "W 3–4", title: "Backend + erste Seiten", tasks: "FastAPI DDD, Personalien, Dashboard", result: "Erste funktionale Seiten", color: "bg-cyan-600", ring: "ring-cyan-600/30" },
  { weeks: "W 5–6", title: "Rechtliche + Termine", tasks: "Consent-Management, Kalender-Integration", result: "Rechtliche Dokumentation + Kalender", color: "bg-teal-500", ring: "ring-teal-500/30" },
  { weeks: "W 7–8", title: "Arzt + Pflege", tasks: "Ärztliche Dokumentation, Pflege-Schichtprotokoll", result: "Klinische Dokumentation komplett", color: "bg-emerald-500", ring: "ring-emerald-500/30" },
  { weeks: "W 9–10", title: "Kurve + Echtzeit", tasks: "Vitaldaten-Charts, WebSocket, Alarme, TimescaleDB", result: "Live-Vitalkurve mit Alarmen", color: "bg-amber-500", ring: "ring-amber-500/30" },
  { weeks: "W 11–12", title: "Compliance & Go-Live", tasks: "Testing, nDSG-Prüfung, IEC 62304 Docs, Deploy", result: "Produktionsreifes PDMS", color: "bg-rose-500", ring: "ring-rose-500/30" },
];

const DELIVERABLES = [
  { type: "SVG", name: "pdms-home-spital-dashboard.svg", desc: "Dashboard Übersicht (1440×900)", session: "Session 3" },
  { type: "SVG", name: "pdms-patient-personalien.svg", desc: "Personalien — 7 Karten", session: "Session 4" },
  { type: "SVG", name: "pdms-patient-kurve.svg", desc: "Vitalkurve 24h", session: "Session 4" },
  { type: "SVG", name: "pdms-patient-arzt.svg", desc: "Ärztliche Dokumentation", session: "Session 5" },
  { type: "SVG", name: "pdms-patient-pflege.svg", desc: "Pflege-Schichtprotokoll", session: "Session 5" },
  { type: "SVG", name: "pdms-patient-termine.svg", desc: "Wochenkalender", session: "Session 6" },
  { type: "SVG", name: "pdms-patient-rechtliche.svg", desc: "Rechtliche (erweitert, 1440×1260)", session: "Session 7" },
  { type: "DOCX", name: "PDMS-Implementierungsanleitung.docx", desc: "10-Schritte Guide + Sidebar/Personalien Detail", session: "Session 8–9" },
  { type: "JSX", name: "pdms-stack-analyse.jsx", desc: "Interaktive Stack-Bewertung", session: "Session 1" },
  { type: "JSX", name: "pdms-zero-cost-stack.jsx", desc: "Zero-Cost Stack-Übersicht", session: "Session 1" },
  { type: "JSX", name: "pdms-roadmap.jsx", desc: "24-Monat Entwicklungs-Roadmap", session: "Session 2" },
  { type: "JSX", name: "pdms-complete-stack.jsx", desc: "Kompletter Stack (erweitert)", session: "Session 1" },
  { type: "PPTX", name: "PDMS-Roadmap.pptx", desc: "12-Folien Roadmap-Präsentation", session: "Session 9" },
  { type: "JSX", name: "pdms-dev-tools-vergleich.jsx", desc: "Zero-Cost Dev-Tools Vergleich", session: "Session 10" },
];

const NEXT_STEPS = [
  { nr: 1, title: "Verzeichnisstruktur finalisieren", desc: "Remaining pages mit gleicher Detailtiefe wie Sidebar/Personalien verfeinern", status: "Bereit", statusColor: "bg-emerald-500" },
  { nr: 2, title: "Monorepo aufsetzen", desc: "git init, React 19 + Next.js 15, Docker Compose, Keycloak, PostgreSQL, nuqs — das leere Gerüst zum Laufen bringen", status: "Nächster Schritt", statusColor: "bg-cyan-500" },
  { nr: 3, title: "Shared Components bauen", desc: "AppSidebar, PatientBand, TabNavigation — erscheinen auf allen 7 Seiten identisch", status: "Woche 1", statusColor: "bg-slate-500" },
  { nr: 4, title: "Personalien-Seite implementieren", desc: "Einfachste Seite (CRUD) — perfekt zum Lernen der Architektur", status: "Woche 3", statusColor: "bg-slate-500" },
  { nr: 5, title: "Storybook + Visual Regression", desc: "SVG-Overlays als Referenz, automatische Pixel-Vergleiche", status: "Parallel", statusColor: "bg-violet-500" },
  { nr: 6, title: "CI/CD Pipeline", desc: "GitHub Actions: Lint, Test, Build, Deploy — IEC 62304 konform", status: "Woche 2", statusColor: "bg-slate-500" },
];

const SECTIONS = [
  { id: "vision", nr: "01", title: "Vision & Kontext", icon: "🎯" },
  { id: "stack", nr: "02", title: "Tech-Stack", icon: "⚙️" },
  { id: "wireframes", nr: "03", title: "7 SVG-Wireframes", icon: "🖼️" },
  { id: "architektur", nr: "04", title: "Architektur", icon: "🏗️" },
  { id: "compliance", nr: "05", title: "Compliance", icon: "🔒" },
  { id: "timeline", nr: "06", title: "12-Wochen-Plan", icon: "📅" },
  { id: "deliverables", nr: "07", title: "Deliverables", icon: "📦" },
  { id: "next", nr: "08", title: "Nächste Schritte", icon: "🚀" },
];

// ─── COMPONENTS ─────────────────────────────────────

function NavPill({ section, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-slate-800 text-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
      }`}
    >
      <span className="text-base">{section.icon}</span>
      <span className="hidden sm:inline">{section.title}</span>
      <span className="sm:hidden text-xs">{section.nr}</span>
    </button>
  );
}

function SectionHeader({ nr, title, subtitle }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl font-black text-cyan-500" style={{ fontFamily: "Georgia, serif" }}>{nr}</span>
        <h2 className="text-xl sm:text-2xl font-black text-white">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-slate-400 ml-10">{subtitle}</p>}
    </div>
  );
}

function VisionSection() {
  return (
    <div>
      <SectionHeader nr="01" title="Vision & Kontext" subtitle="Home-Spital PDMS für die Schweiz" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5">
            <h3 className="font-bold text-cyan-400 text-sm mb-2">{VISION.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{VISION.desc}</p>
          </div>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5">
            <h3 className="font-bold text-cyan-400 text-sm mb-1">Zielgruppe</h3>
            <p className="text-sm text-slate-300">{VISION.targets}</p>
          </div>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-5">
            <h3 className="font-bold text-cyan-400 text-sm mb-1">Regulatorische Anforderungen</h3>
            <p className="text-sm text-slate-300">{VISION.regs}</p>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-2">
          {VISION.facts.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-800 border border-slate-700 p-3">
              <span className="text-xl">{f.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500">{f.label}</div>
                <div className="text-sm font-bold text-white truncate">{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StackSection() {
  const colorMap = { cyan: "border-cyan-500/30 bg-cyan-500/5", emerald: "border-emerald-500/30 bg-emerald-500/5", violet: "border-violet-500/30 bg-violet-500/5", amber: "border-amber-500/30 bg-amber-500/5" };
  const headerMap = { cyan: "bg-cyan-500", emerald: "bg-emerald-500", violet: "bg-violet-500", amber: "bg-amber-500" };
  const dotMap = { cyan: "bg-cyan-400", emerald: "bg-emerald-400", violet: "bg-violet-400", amber: "bg-amber-400" };
  return (
    <div>
      <SectionHeader nr="02" title="Tech-Stack" subtitle="Zero-Cost, 100% Open-Source" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STACK_GROUPS.map((g) => (
          <div key={g.title} className={`rounded-xl border overflow-hidden ${colorMap[g.color]}`}>
            <div className={`${headerMap[g.color]} px-3 py-2`}>
              <span className="text-xs font-black text-white tracking-widest">{g.title}</span>
            </div>
            <div className="p-3 space-y-2">
              {g.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${dotMap[g.color]} flex-shrink-0`} />
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WireframesSection() {
  const cxColor = { "Sehr hoch": "text-rose-400", Hoch: "text-amber-400", Mittel: "text-cyan-400", Niedrig: "text-emerald-400" };
  const borderColor = { cyan: "border-cyan-500/30", emerald: "border-emerald-500/30", rose: "border-rose-500/30", amber: "border-amber-500/30" };
  return (
    <div>
      <SectionHeader nr="03" title="7 SVG-Wireframes" subtitle="Jede Seite als 1440×900px SVG — verbindliche Design-Referenz" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {WIREFRAMES.map((wf, i) => (
          <div key={i} className={`rounded-xl border bg-slate-800/60 p-4 ${borderColor[wf.color]}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-cyan-500 flex items-center justify-center text-white text-xs font-black">
                {i + 1}
              </div>
              <span className="font-bold text-white text-sm">{wf.name}</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">{wf.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{wf.comps}+ Komp.</span>
              <span className={`text-xs font-bold ${cxColor[wf.complexity]}`}>{wf.complexity}</span>
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/30 p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl mb-1">📊</span>
          <span className="text-xs text-slate-500 font-bold">120+ Komponenten</span>
          <span className="text-xs text-slate-600">Total über alle Seiten</span>
        </div>
      </div>
    </div>
  );
}

function ArchitekturSection() {
  return (
    <div>
      <SectionHeader nr="04" title="Architektur" subtitle="6-Schichten DDD-Modell" />
      <div className="space-y-2">
        {LAYERS.map((l, i) => (
          <div key={i}>
            <div className="flex items-stretch gap-2 rounded-xl bg-slate-800/60 border border-slate-700 overflow-hidden">
              <div className={`w-1.5 ${l.color} flex-shrink-0 rounded-l-xl`} />
              <div className="flex-1 p-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <span className="font-bold text-white text-sm w-32 flex-shrink-0">{l.name}</span>
                <span className="text-xs text-cyan-400 font-medium w-56 flex-shrink-0">{l.tech}</span>
                <span className="text-xs text-slate-400 flex-1">{l.items}</span>
              </div>
            </div>
            {i < LAYERS.length - 1 && (
              <div className="text-center py-0.5">
                <span className="text-slate-600 text-xs">↕</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplianceSection() {
  return (
    <div>
      <SectionHeader nr="05" title="Compliance & Regulatorik" subtitle="Schweiz — nDSG, EPDG, IEC 62304" />
      <div className="space-y-2">
        {COMPLIANCE.map((c, i) => (
          <div key={i} className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-cyan-400 text-sm">{c.reg}</span>
                <span className="text-xs text-slate-500">—</span>
                <span className="text-sm text-slate-300">{c.desc}</span>
              </div>
              <div className="text-xs text-slate-400 bg-slate-900/50 rounded-lg px-3 py-1.5 mt-1 inline-block">
                → {c.impl}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineSection() {
  const [active, setActive] = useState(0);
  return (
    <div>
      <SectionHeader nr="06" title="12-Wochen Implementierungsplan" subtitle="Von Setup bis Go-Live" />
      {/* Timeline bar */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
        {TIMELINE.map((p, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              active === i
                ? `${p.ring} ring-2 bg-slate-800 border-transparent`
                : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/60"
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${p.color} flex-shrink-0`} />
            <span className={`text-xs font-bold ${active === i ? "text-white" : "text-slate-400"}`}>{p.weeks}</span>
          </button>
        ))}
      </div>
      {/* Active phase detail */}
      <div className={`rounded-xl border border-slate-700 bg-slate-800/60 p-5 ${TIMELINE[active].ring} ring-1`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${TIMELINE[active].color} flex items-center justify-center text-white font-black text-sm`}>
            {active + 1}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{TIMELINE[active].title}</h3>
            <span className="text-xs text-slate-500">{TIMELINE[active].weeks}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Aufgaben</div>
            <p className="text-sm text-slate-300 leading-relaxed">{TIMELINE[active].tasks}</p>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Ergebnis</div>
            <div className={`text-sm font-bold text-white rounded-lg p-3 ${TIMELINE[active].color}/10 border border-slate-700`}>
              → {TIMELINE[active].result}
            </div>
          </div>
        </div>
      </div>
      {/* Mini timeline */}
      <div className="flex items-center mt-4 gap-0">
        {TIMELINE.map((p, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div className={`h-1 flex-1 rounded-full ${i <= active ? p.color : "bg-slate-700"} transition-colors`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-600">Start</span>
        <span className="text-xs text-slate-600">Go-Live</span>
      </div>
    </div>
  );
}

function DeliverablesSection() {
  const typeColors = { SVG: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", DOCX: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", JSX: "text-violet-400 bg-violet-500/10 border-violet-500/30", PPTX: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
  const counts = { SVG: 0, DOCX: 0, JSX: 0, PPTX: 0 };
  DELIVERABLES.forEach((d) => counts[d.type]++);
  return (
    <div>
      <SectionHeader nr="07" title="Erstellte Deliverables" subtitle={`${DELIVERABLES.length} Dateien — Stand 09.02.2026`} />
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(counts).map(([type, count]) => (
          <div key={type} className={`rounded-full px-3 py-1 border text-xs font-bold ${typeColors[type]}`}>
            {count} {type}
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="rounded-xl border border-slate-700 overflow-hidden">
        <div className="bg-slate-800 px-4 py-2 flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
          <span className="w-12">Typ</span>
          <span className="flex-1">Dateiname</span>
          <span className="w-48 hidden sm:block">Beschreibung</span>
          <span className="w-20 text-right">Session</span>
        </div>
        <div className="divide-y divide-slate-800">
          {DELIVERABLES.map((d, i) => (
            <div key={i} className={`px-4 py-2.5 flex items-center gap-4 text-sm ${i % 2 === 0 ? "bg-slate-900/30" : "bg-slate-900/10"}`}>
              <span className={`w-12 text-xs font-bold ${typeColors[d.type].split(" ")[0]}`}>{d.type}</span>
              <span className="flex-1 text-slate-300 text-xs sm:text-sm truncate">{d.name}</span>
              <span className="w-48 text-xs text-slate-500 hidden sm:block truncate">{d.desc}</span>
              <span className="w-20 text-xs text-slate-600 text-right">{d.session}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NextStepsSection() {
  return (
    <div>
      <SectionHeader nr="08" title="Nächste Schritte" subtitle="Was als Nächstes kommt" />
      <div className="space-y-3">
        {NEXT_STEPS.map((ns) => (
          <div key={ns.nr} className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {ns.nr}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">{ns.title}</span>
                <span className={`${ns.statusColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{ns.status}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{ns.desc}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Final stats */}
      <div className="mt-6 rounded-xl bg-gradient-to-r from-cyan-950/50 to-slate-900 border border-cyan-500/20 p-6 text-center">
        <div className="grid grid-cols-4 gap-4">
          {[
            { num: "7", label: "SVG-Wireframes" },
            { num: "12", label: "Wochen Plan" },
            { num: "120+", label: "Komponenten" },
            { num: "∞", label: "Möglichkeiten" },
          ].map((st, i) => (
            <div key={i}>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400">{st.num}</div>
              <div className="text-xs text-slate-500 mt-0.5">{st.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────

export default function PDMSRoadmap() {
  const [activeSection, setActiveSection] = useState("vision");

  const renderSection = () => {
    switch (activeSection) {
      case "vision": return <VisionSection />;
      case "stack": return <StackSection />;
      case "wireframes": return <WireframesSection />;
      case "architektur": return <ArchitekturSection />;
      case "compliance": return <ComplianceSection />;
      case "timeline": return <TimelineSection />;
      case "deliverables": return <DeliverablesSection />;
      case "next": return <NextStepsSection />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-8 rounded-full bg-cyan-500" />
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white leading-tight">PDMS HOME-SPITAL</h1>
              <p className="text-xs text-slate-500">Projekt-Roadmap · v1.2.0 · 09.02.2026</p>
            </div>
            <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
              {["React 19", "Next.js 15", "FastAPI", "PostgreSQL 16", "CH-Compliance"].map((b) => (
                <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 hidden sm:inline-block">
                  {b}
                </span>
              ))}
            </div>
          </div>
          {/* Navigation */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {SECTIONS.map((s) => (
              <NavPill key={s.id} section={s} active={activeSection === s.id} onClick={() => setActiveSection(s.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {renderSection()}
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-4 pb-6 text-center">
        <p className="text-xs text-slate-700">
          Vom SVG-Wireframe zur produktionsreifen Anwendung · Alle Arbeitsergebnisse konsolidiert
        </p>
      </div>
    </div>
  );
}
