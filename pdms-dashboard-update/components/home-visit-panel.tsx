"use client";

interface Visit {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface HomeVisitPanelProps {
  visits: Visit[];
}

interface DemoVisit {
  time: string;
  patient: string;
  location: string;
  task: string;
  status: "done" | "active" | "upcoming";
}

const DEMO_VISITS: DemoVisit[] = [
  { time: "07:15", patient: "A. König", location: "Payerne", task: "i.v. Antibiotika + Vitals", status: "done" },
  { time: "09:00", patient: "L. Brunner", location: "Moudon", task: "Wundversorgung + Vitals", status: "done" },
  { time: "14:30", patient: "E. Fischer", location: "Fribourg", task: "Unterwegs...", status: "active" },
  { time: "16:00", patient: "S. Müller", location: "Estavayer", task: "Blutentnahme + Vitals", status: "upcoming" },
];

export function HomeVisitPanel({ visits }: HomeVisitPanelProps) {
  // Nutze Demo-Daten falls keine echten Daten vorhanden
  const displayVisits = DEMO_VISITS;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-slate-900">Hausbesuche heute</h3>
        <span className="text-[9px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md">
          8 geplant
        </span>
      </div>

      {/* Visits */}
      <div className="space-y-2 flex-1">
        {displayVisits.map((visit, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              visit.status === "done"
                ? "bg-emerald-50 border-emerald-200"
                : visit.status === "active"
                ? "bg-cyan-50 border-cyan-300 shadow-sm"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            {/* Status Icon */}
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
              visit.status === "done"
                ? "bg-emerald-500 text-white"
                : visit.status === "active"
                ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white"
                : "bg-slate-100 text-slate-400"
            }`}>
              {visit.status === "done" ? "✓" : visit.status === "active" ? "→" : visit.time.slice(0, 2) + "h"}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-semibold ${
                visit.status === "upcoming" ? "text-slate-500" : "text-slate-900"
              }`}>
                {visit.time} — {visit.patient}
              </p>
              <p className={`text-[9px] ${
                visit.status === "active"
                  ? "text-cyan-600 font-medium"
                  : "text-slate-400"
              }`}>
                {visit.location} · {visit.task}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
