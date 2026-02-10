"use client";

interface MedicationTimelineProps {
  patientId: string | null;
}

interface MedEntry {
  name: string;
  dose: string;
  route: string;
  admin: string;
  colorDot: string;
  slots: { time: string; status: "done" | "due" | "planned"; by?: string }[];
}

// Demo-Daten
const DEMO_MEDS: MedEntry[] = [
  {
    name: "Ceftriaxon i.v.",
    dose: "2g · i.v.",
    route: "Pflegefachperson",
    admin: "pflege",
    colorDot: "bg-red-100",
    slots: [
      { time: "07:00", status: "done", by: "Pflege 07:15" },
      { time: "18:00", status: "due" },
    ],
  },
  {
    name: "Ramipril",
    dose: "5mg · oral",
    route: "Selbstmedikation",
    admin: "selbst",
    colorDot: "bg-cyan-100",
    slots: [
      { time: "07:00", status: "done", by: "Patient 07:30" },
    ],
  },
  {
    name: "Metformin",
    dose: "850mg · oral · 2x tägl.",
    route: "Selbst",
    admin: "selbst",
    colorDot: "bg-emerald-100",
    slots: [
      { time: "07:00", status: "done" },
      { time: "18:00", status: "planned" },
    ],
  },
  {
    name: "Pantoprazol",
    dose: "40mg · oral · morgens",
    route: "Selbst",
    admin: "selbst",
    colorDot: "bg-violet-100",
    slots: [
      { time: "07:00", status: "done" },
    ],
  },
  {
    name: "Enoxaparin s.c.",
    dose: "40mg · s.c.",
    route: "Pflegefachperson",
    admin: "pflege",
    colorDot: "bg-amber-100",
    slots: [
      { time: "09:00", status: "done", by: "Pflege 09:00" },
    ],
  },
];

const TIME_COLUMNS = ["07:00", "09:00", "12:00", "18:00", "22:00"];

function StatusDot({ status, by }: { status: string; by?: string }) {
  if (status === "done") {
    return (
      <div className="flex items-center gap-1">
        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
          <span className="text-white text-[7px] font-bold">✓</span>
        </div>
        {by && <span className="text-[8px] text-slate-400">{by}</span>}
      </div>
    );
  }
  if (status === "due") {
    return (
      <div className="flex items-center gap-1">
        <div className="w-3.5 h-3.5 rounded-full bg-white border-[1.5px] border-amber-400 flex items-center justify-center">
          <span className="text-amber-500 text-[7px] font-bold">!</span>
        </div>
        <span className="text-[8px] text-amber-600 font-medium">Fällig</span>
      </div>
    );
  }
  // planned
  return (
    <div className="w-3.5 h-3.5 rounded-full bg-white border-[1.5px] border-slate-200" />
  );
}

export function MedicationTimeline({ patientId }: MedicationTimelineProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-slate-900">Medikamentenplan (Zuhause)</h3>
        <button className="text-[10px] font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 rounded-lg hover:shadow-md transition-shadow">
          + Verordnung
        </button>
      </div>

      {/* Timeline Table */}
      <div className="overflow-x-auto">
        {/* Header Row */}
        <div className="flex items-center bg-slate-50 rounded-lg px-3 py-2 mb-1 min-w-[500px]">
          <div className="w-[180px] shrink-0">
            <span className="text-[9px] font-semibold text-slate-500">Medikament</span>
          </div>
          {TIME_COLUMNS.map((time) => (
            <div key={time} className="flex-1 text-center">
              <span className="text-[9px] font-semibold text-slate-500">{time}</span>
            </div>
          ))}
        </div>

        {/* Medication Rows */}
        {DEMO_MEDS.map((med, idx) => (
          <div
            key={idx}
            className="flex items-center px-3 py-2.5 border-b border-slate-50 last:border-0 min-w-[500px]"
          >
            {/* Med Info */}
            <div className="w-[180px] shrink-0 flex items-start gap-2">
              <div className={`w-2.5 h-2.5 rounded mt-0.5 shrink-0 ${med.colorDot}`} />
              <div>
                <p className="text-[11px] font-semibold text-slate-900 leading-tight">{med.name}</p>
                <p className="text-[9px] text-slate-400">{med.dose} · {med.route}</p>
              </div>
            </div>

            {/* Time Slots */}
            {TIME_COLUMNS.map((time) => {
              const slot = med.slots.find((s) => s.time === time);
              return (
                <div key={time} className="flex-1 flex justify-center">
                  {slot ? <StatusDot status={slot.status} by={slot.by} /> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-emerald-500" />
          <span className="text-[8px] text-slate-500">Verabreicht</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-amber-400" />
          <span className="text-[8px] text-slate-500">Fällig</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-slate-200" />
          <span className="text-[8px] text-slate-500">Geplant</span>
        </div>
        <span className="text-[8px] text-slate-300">|</span>
        <span className="text-[8px] text-cyan-600 font-medium">🏠 Selbst</span>
        <span className="text-[8px] text-violet-600 font-medium">👩‍⚕️ Pflege</span>
      </div>
    </div>
  );
}
