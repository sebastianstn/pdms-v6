"use client";

import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/patients", label: "Patienten", icon: "👤" },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800">
        <span className="text-xl font-bold text-white">🏥 PDMS</span>
        <span className="ml-2 text-xs text-slate-500">Home-Spital</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-slate-800 text-white font-medium"
                : "hover:bg-slate-800/60 hover:text-white"
            )}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.roles?.[0]}</p>
          </div>
          <button onClick={logout} className="text-slate-500 hover:text-white text-xs" title="Abmelden">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
