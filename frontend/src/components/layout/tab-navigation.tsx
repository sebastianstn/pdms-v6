"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  UserCircle,
  Activity,
  Stethoscope,
  HeartPulse,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TABS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "uebersicht", label: "Übersicht", icon: LayoutGrid },
  { key: "personalien", label: "Personalien", icon: UserCircle },
  { key: "kurve", label: "Kurve", icon: Activity },
  { key: "arzt", label: "Arzt", icon: Stethoscope },
  { key: "pflege", label: "Pflege", icon: HeartPulse },
  { key: "termine", label: "Termine", icon: CalendarDays },
  { key: "rechtliche", label: "Rechtliche", icon: ShieldCheck },
];

export function TabNavigation() {
  const { patientId } = useParams<{ patientId: string }>();
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 mt-0 bg-white rounded-xl border border-slate-200 p-1.5">
      {TABS.map((tab) => {
        const href = `/patients/${patientId}/${tab.key}`;
        const isActive = pathname.endsWith(tab.key);
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
