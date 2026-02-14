"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAlarmCounts } from "@/hooks/use-alarms";
import { AlarmBell } from "@/components/vitals/alarm-bell";
import { Search, Loader2, Home, ChevronLeft, ChevronRight, Printer, User } from "lucide-react";
import { usePatients } from "@/hooks/use-patients";
import { useAuth } from "@/providers/auth-provider";
import { ThemeToggleSimple } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useTranslation } from "react-i18next";

export function TopBar() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { data: alarmCounts } = useAlarmCounts();
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce: 300ms nach Eingabe suchen
  useEffect(() => {
    if (!search.trim()) {
      setDebouncedSearch("");
      return;
    }
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // API-Suche nur bei mindestens 2 Zeichen
  const { data, isLoading } = usePatients(1, debouncedSearch.length >= 2 ? debouncedSearch : undefined);
  const results = debouncedSearch.length >= 2 ? (data?.items ?? []) : [];

  // Dropdown schliessen bei Klick ausserhalb
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(patientId: string) {
    setSearch("");
    setDebouncedSearch("");
    setShowResults(false);
    router.push(`/patients/${patientId}`);
  }

  const navBtnClass =
    "w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0">
      {/* Left: Navigation + Search */}
      <div className="flex items-center gap-2">
        {/* Home */}
        <button
          onClick={() => router.push("/patients")}
          className={navBtnClass}
          title={t("nav.home")}
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Zurück */}
        <button
          onClick={() => router.back()}
          className={navBtnClass}
          title={t("nav.back")}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Vorwärts */}
        <button
          onClick={() => router.forward()}
          className={navBtnClass}
          title={t("nav.forward")}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Drucken */}
        <button
          onClick={() => window.print()}
          className={navBtnClass}
          title={t("nav.print")}
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Trenner */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Search */}
        <div className="relative w-80" ref={containerRef}>
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => search.trim().length >= 2 && setShowResults(true)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
          {isLoading && debouncedSearch.length >= 2 ? (
            <Loader2 className="absolute left-3 top-2.5 w-4 h-4 text-blue-500 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          )}

          {/* Suchergebnisse Dropdown */}
          {showResults && debouncedSearch.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">{t("search.loading")}</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                  {t("search.noResults")} &quot;{debouncedSearch}&quot;
                </div>
              ) : (
                results.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelect(patient.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {patient.ahv_number && `AHV: ${patient.ahv_number} · `}
                      {patient.date_of_birth && `Geb.: ${new Date(patient.date_of_birth).toLocaleDateString("de-CH")}`}
                    </p>
                  </button>
                ))
              )}
              {results.length > 0 && (
                <button
                  onClick={() => {
                    router.push(`/patients?search=${encodeURIComponent(debouncedSearch)}`);
                    setShowResults(false);
                    setSearch("");
                  }}
                  className="w-full px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 font-medium text-center"
                >
                  {t("search.showAll", { count: data?.total ?? results.length })}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <AlarmBell count={alarmCounts?.total ?? 0} onClick={() => router.push("/dashboard")} />

        {/* Trenner */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        {/* Theme Toggle */}
        <ThemeToggleSimple />

        {/* Sprache */}
        <LanguageSelector />

        {/* Trenner */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        {/* Datum */}
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </span>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 max-w-[160px] truncate">
            {user?.name ?? "—"}
          </span>
        </div>
      </div>
    </header>
  );
}
