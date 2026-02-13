"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface AlarmBadgeProps {
  severity: "info" | "warning" | "critical";
  label: string;
}

export function AlarmBadge({ severity, label }: AlarmBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      severity === "critical" && "bg-red-100 text-red-700 animate-pulse",
      severity === "warning" && "bg-amber-100 text-amber-700",
      severity === "info" && "bg-blue-100 text-blue-700",
    )}>
      {severity === "critical" ? <AlertCircle className="w-3 h-3" /> : severity === "warning" ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
      {label}
    </span>
  );
}
