/**
 * Sprach-Selector — Umschalter für De/Fr/It
 */
"use client";

import { useTranslation } from "react-i18next";
import { changeLanguage, LANGUAGES } from "@/lib/i18n";

export function LanguageSelector() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    return (
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
            {LANGUAGES.map(({ code, label }) => (
                <button
                    key={code}
                    onClick={() => changeLanguage(code)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${currentLang === code
                        ? "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                    title={label}
                >
                    {code.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
