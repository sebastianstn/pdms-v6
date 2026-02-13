/**
 * I18n Provider — Initialisiert i18next für die gesamte App
 */
"use client";

import "@/lib/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
