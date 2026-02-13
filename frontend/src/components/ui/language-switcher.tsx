/**
 * Sprachumschalter-Komponente
 * Zeigt Dropdown mit den vier Schweizer Sprachen + Englisch
 */
"use client";

import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    changeLanguage,
    LANGUAGES,
    type LanguageCode,
} from "@/lib/i18n";

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    return (
        <div className="relative inline-block">
            <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
                className="appearance-none rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm
          focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
          dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                aria-label="Sprache wählen"
            >
                {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label}
                    </option>
                ))}
            </select>
            <Globe className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
    );
}
