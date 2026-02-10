"use client";

export function StatusBar() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mt-3 flex items-center gap-3 px-1 py-1.5 shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      <div className="flex items-center gap-2 text-[8px] text-slate-400 flex-wrap">
        <span>System Online</span>
        <span>·</span>
        <span>Remote-Monitoring: 22/24 verbunden</span>
        <span>·</span>
        <span>DB: PostgreSQL 16 + TimescaleDB</span>
        <span>·</span>
        <span>FHIR R4 + CH Core</span>
        <span>·</span>
        <span>🔒 Daten in CH (nDSG-konform)</span>
      </div>
      <span className="ml-auto text-[8px] text-slate-400 shrink-0">
        PDMS Home-Spital v0.1.0 · {dateStr} {timeStr}
      </span>
    </div>
  );
}
