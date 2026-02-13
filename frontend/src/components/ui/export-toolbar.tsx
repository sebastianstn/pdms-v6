/**
 * Export-Toolbar — Buttons für Drucken, CSV-Export, JSON-Export
 */
"use client";

import { Download, FileSpreadsheet, FileJson, Printer } from "lucide-react";

import { exportCSV, exportJSON, printContent } from "@/lib/export";

interface ExportToolbarProps<T extends Record<string, unknown>> {
    /** Daten zum Exportieren */
    data: T[];
    /** Dateiname ohne Erweiterung */
    filename: string;
    /** Spalten-Mapping für CSV (optional) */
    columns?: { key: keyof T; label: string }[];
    /** ID des Elements zum Drucken (optional, sonst ganze Seite) */
    printElementId?: string;
    /** Kompakte Darstellung */
    compact?: boolean;
}

export function ExportToolbar<T extends Record<string, unknown>>({
    data,
    filename,
    columns,
    printElementId,
    compact = false,
}: ExportToolbarProps<T>) {
    const buttonClass = compact
        ? "inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        : "inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800";

    return (
        <div className="no-print flex items-center gap-2">
            <button
                onClick={() => printContent(printElementId)}
                className={buttonClass}
                title="Drucken"
            >
                <Printer className="h-4 w-4" />
                {!compact && <span>Drucken</span>}
            </button>

            <button
                onClick={() => exportCSV(data, filename, columns)}
                className={buttonClass}
                title="CSV exportieren"
                disabled={data.length === 0}
            >
                <FileSpreadsheet className="h-4 w-4" />
                {!compact && <span>CSV</span>}
            </button>

            <button
                onClick={() => exportJSON(data, filename)}
                className={buttonClass}
                title="JSON exportieren"
                disabled={data.length === 0}
            >
                <FileJson className="h-4 w-4" />
                {!compact && <span>JSON</span>}
            </button>
        </div>
    );
}
