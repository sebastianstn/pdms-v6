"use client";

import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Hospital, LogOut, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const NAV_ITEMS: { href: string; labelKey: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/patients", labelKey: "nav.patients", icon: Users },
  { href: "/admin", labelKey: "nav.admin", icon: Shield, adminOnly: true },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <aside className="w-48 bg-slate-900 text-slate-300 flex flex-col shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="h-16 flex items-center px-3 border-b border-slate-800">
        <Hospital className="w-5 h-5 text-blue-400 shrink-0" />
        <span className="text-lg font-bold text-white ml-1.5">PDMS</span>
        <span className="ml-1.5 text-[10px] text-slate-500">Home-Spital</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.filter(
          (item) => !item.adminOnly || user?.roles?.includes("admin")
        ).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-slate-800 text-white font-medium"
                : "hover:bg-slate-800/60 hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{t(item.labelKey)}</span>
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-2 py-2.5 border-t border-slate-800">
        <div className="flex items-center gap-2 px-1">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-600 text-[10px] font-bold text-white shrink-0">
            {user?.name?.charAt(0) ?? "?"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-slate-100 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 truncate capitalize">{user?.roles?.[0]}</p>
          </div>
          <button
            onClick={logout}
            className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title={t("nav.logout")}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
