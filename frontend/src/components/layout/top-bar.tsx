"use client";

import { useState } from "react";
import { useAlarmCounts } from "@/hooks/use-alarms";
import { AlarmBell } from "@/components/vitals/alarm-bell";
import { Search } from "lucide-react";

export function TopBar() {
  const [search, setSearch] = useState("");
  const { data: alarmCounts } = useAlarmCounts();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="relative w-80">
        <input
          type="text"
          placeholder="Patient suchen (Name, AHV)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <AlarmBell count={alarmCounts?.total ?? 0} />
        <span className="text-xs text-slate-400">
          {new Date().toLocaleDateString("de-CH")}
        </span>
      </div>
    </header>
  );
}
