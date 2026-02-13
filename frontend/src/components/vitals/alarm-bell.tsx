"use client";

import { Bell } from "lucide-react";

interface AlarmBellProps {
  count: number;
  onClick?: () => void;
}

export function AlarmBell({ count, onClick }: AlarmBellProps) {
  return (
    <button onClick={onClick} className="relative text-slate-500 hover:text-slate-700">
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
