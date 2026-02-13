"use client";

import { useState } from "react";
import { Badge, Spinner } from "@/components/ui";
import {
    useAuditLogs,
    usePatientAuditLogs,
    type AuditFilters,
    type AuditLogEntry,
} from "@/hooks/use-audit";

// ─── Hilfsfunktionen ─────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
    POST: "Erstellen",
    PATCH: "Ändern",
    PUT: "Aktualisieren",
    DELETE: "Löschen",
};

const ACTION_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
    POST: "success",
    PATCH: "info",
    PUT: "info",
    DELETE: "danger",
};

const ROLE_LABELS: Record<string, string> = {
    arzt: "Arzt",
    pflege: "Pflege",
    admin: "Admin",
};

function fmtDateTime(iso: string) {
    return new Date(iso).toLocaleString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function extractResource(resourceType: string): string {
    // /api/v1/patients/UUID/vitals → patients/.../vitals
    const cleaned = resourceType
        .replace(/^\/api\/v1\//, "")
        .replace(
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
            "•••"
        );
    return cleaned;
}

// ─── Filter-Leiste ───────────────────────────────────────────

function AuditFiltersBar({
    filters,
    onChange,
}: {
    filters: AuditFilters;
    onChange: (f: AuditFilters) => void;
}) {
    return (
        <div className="flex flex-wrap gap-3 mb-4">
            <select
                className="rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                value={filters.action || ""}
                onChange={(e) => onChange({ ...filters, action: e.target.value || undefined, page: 1 })}
            >
                <option value="">Alle Aktionen</option>
                <option value="POST">Erstellen (POST)</option>
                <option value="PATCH">Ändern (PATCH)</option>
                <option value="PUT">Aktualisieren (PUT)</option>
                <option value="DELETE">Löschen (DELETE)</option>
            </select>

            <input
                type="text"
                placeholder="Ressource filtern..."
                className="rounded border border-slate-300 px-3 py-1.5 text-sm w-48"
                value={filters.resource_type || ""}
                onChange={(e) =>
                    onChange({ ...filters, resource_type: e.target.value || undefined, page: 1 })
                }
            />

            <input
                type="date"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm"
                value={filters.date_from || ""}
                onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined, page: 1 })}
            />
            <span className="self-center text-sm text-slate-500">bis</span>
            <input
                type="date"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm"
                value={filters.date_to || ""}
                onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined, page: 1 })}
            />
        </div>
    );
}

// ─── Einzelne Zeile ──────────────────────────────────────────

function AuditRow({
    entry,
    onSelect,
}: {
    entry: AuditLogEntry;
    onSelect: (e: AuditLogEntry) => void;
}) {
    return (
        <tr
            className="hover:bg-slate-50 cursor-pointer border-b border-slate-100"
            onClick={() => onSelect(entry)}
        >
            <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                {fmtDateTime(entry.created_at)}
            </td>
            <td className="px-3 py-2">
                <Badge variant={ACTION_VARIANT[entry.action] || "default"}>
                    {ACTION_LABELS[entry.action] || entry.action}
                </Badge>
            </td>
            <td className="px-3 py-2 text-sm font-mono text-slate-700">
                {extractResource(entry.resource_type)}
            </td>
            <td className="px-3 py-2 text-sm">
                <Badge variant="default">
                    {ROLE_LABELS[entry.user_role] || entry.user_role}
                </Badge>
            </td>
            <td className="px-3 py-2 text-xs text-slate-400">
                {entry.ip_address || "—"}
            </td>
            <td className="px-3 py-2 text-xs text-slate-400">
                {String(entry.details?.status ?? "—")}
            </td>
        </tr>
    );
}

// ─── Detail-Ansicht ──────────────────────────────────────────

function AuditDetailPanel({
    entry,
    onClose,
}: {
    entry: AuditLogEntry;
    onClose: () => void;
}) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-sm">Audit-Detail</h4>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                    ✕
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <span className="text-slate-500">Zeitpunkt:</span>
                    <p className="font-medium">{fmtDateTime(entry.created_at)}</p>
                </div>
                <div>
                    <span className="text-slate-500">Aktion:</span>
                    <p>
                        <Badge variant={ACTION_VARIANT[entry.action] || "default"}>
                            {ACTION_LABELS[entry.action] || entry.action}
                        </Badge>
                    </p>
                </div>
                <div>
                    <span className="text-slate-500">Benutzer-ID:</span>
                    <p className="font-mono text-xs break-all">{entry.user_id}</p>
                </div>
                <div>
                    <span className="text-slate-500">Rolle:</span>
                    <p>{ROLE_LABELS[entry.user_role] || entry.user_role}</p>
                </div>
                <div>
                    <span className="text-slate-500">Ressource:</span>
                    <p className="font-mono text-xs break-all">{entry.resource_type}</p>
                </div>
                <div>
                    <span className="text-slate-500">Ressource-ID:</span>
                    <p className="font-mono text-xs">{entry.resource_id || "—"}</p>
                </div>
                <div>
                    <span className="text-slate-500">IP-Adresse:</span>
                    <p>{entry.ip_address || "—"}</p>
                </div>
                <div>
                    <span className="text-slate-500">HTTP-Status:</span>
                    <p>{String(entry.details?.status ?? "—")}</p>
                </div>
            </div>

            {entry.details && Object.keys(entry.details).length > 0 && (
                <div className="mt-3">
                    <span className="text-sm text-slate-500">Details (JSON):</span>
                    <pre className="mt-1 bg-white border border-slate-200 rounded p-2 text-xs overflow-auto max-h-32">
                        {JSON.stringify(entry.details, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

// ─── Pagination ──────────────────────────────────────────────

function Pagination({
    page,
    perPage,
    total,
    onPageChange,
}: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (p: number) => void;
}) {
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-slate-500">
                {total} Einträge · Seite {page}/{totalPages}
            </span>
            <div className="flex gap-2">
                <button
                    className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    ← Zurück
                </button>
                <button
                    className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Weiter →
                </button>
            </div>
        </div>
    );
}

// ─── Haupt-Tabelle ───────────────────────────────────────────

interface AuditLogTableProps {
    /** Wenn gesetzt, wird nur der Audit-Trail dieses Patienten angezeigt. */
    patientId?: string;
}

export function AuditLogTable({ patientId }: AuditLogTableProps) {
    const [filters, setFilters] = useState<AuditFilters>({
        page: 1,
        per_page: 25,
    });
    const [selected, setSelected] = useState<AuditLogEntry | null>(null);

    // Patientenspezifisch oder global
    const globalQuery = useAuditLogs(patientId ? { page: 0 } : filters);
    const patientQuery = usePatientAuditLogs(patientId || "", filters);

    const { data, isLoading, error } = patientId ? patientQuery : globalQuery;

    if (isLoading) return <Spinner />;
    if (error) {
        return (
            <div className="text-center py-8 text-slate-500">
                <p className="text-sm">
                    {error.message?.includes("403")
                        ? "Zugriff verweigert — nur Admin kann Audit-Logs einsehen."
                        : `Fehler: ${error.message}`}
                </p>
            </div>
        );
    }

    const items = data?.items || [];
    const total = data?.total || 0;

    return (
        <div>
            <AuditFiltersBar filters={filters} onChange={setFilters} />

            {selected && (
                <AuditDetailPanel entry={selected} onClose={() => setSelected(null)} />
            )}

            {items.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <p>Keine Audit-Einträge gefunden.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                                <tr>
                                    <th className="px-3 py-2">Zeitpunkt</th>
                                    <th className="px-3 py-2">Aktion</th>
                                    <th className="px-3 py-2">Ressource</th>
                                    <th className="px-3 py-2">Rolle</th>
                                    <th className="px-3 py-2">IP</th>
                                    <th className="px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((entry) => (
                                    <AuditRow key={entry.id} entry={entry} onSelect={setSelected} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        page={filters.page || 1}
                        perPage={filters.per_page || 25}
                        total={total}
                        onPageChange={(p) => setFilters({ ...filters, page: p })}
                    />
                </>
            )}
        </div>
    );
}
