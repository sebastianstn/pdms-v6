"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "personalien", label: "Personalien", icon: "📋" },
  { key: "kurve", label: "Kurve", icon: "📈" },
  { key: "arzt", label: "Arzt", icon: "🩺" },
  { key: "pflege", label: "Pflege", icon: "💉" },
  { key: "termine", label: "Termine", icon: "📅" },
  { key: "rechtliche", label: "Rechtliche", icon: "⚖️" },
];

export function TabNavigation() {
  const { patientId } = useParams<{ patientId: string }>();
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 mt-4 bg-white rounded-xl border border-slate-200 p-1.5">
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
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
