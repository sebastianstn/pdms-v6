"use client";

import { useState } from "react";
import { Badge, Spinner } from "@/components/ui";
import {
    useEncounters,
    ENCOUNTER_TYPE_LABELS,
    ENCOUNTER_STATUS_LABELS,
    type Encounter,
    type EncounterStatus,
} from "@/hooks/use-encounters";

// ─── Helpers ──────────────────────────────────────────────────

const statusVariant: Record<EncounterStatus, "default" | "success" | "warning" | "danger" | "info"> = {
    planned: "info",
    active: "success",
    finished: "default",
    cancelled: "danger",
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function duration(start: string, end?: string): string {
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    const days = Math.floor((e - s) / (1000 * 60 * 60 * 24));
    if (days === 0) return "< 1 Tag";
    return `${days} Tag${days !== 1 ? "e" : ""}`;
}

// ─── Props ────────────────────────────────────────────────────

interface EncounterHistoryProps {
    patientId: string;
}

// ─── Component ────────────────────────────────────────────────

export function EncounterHistory({ patientId }: EncounterHistoryProps) {
    const [filterStatus, setFilterStatus] = useState<EncounterStatus | "">("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useEncounters(patientId, {
        status: filterStatus || undefined,
        page,
        per_page: 20,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    const encounters = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 20);

    return (
        <div className="space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-3">
                <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value as EncounterStatus | ""); setPage(1); }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
                >
                    <option value="">Alle Status</option>
                    {Object.entries(ENCOUNTER_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
                <span className="text-xs text-slate-400 ml-auto">
                    {total} Aufenthalt{total !== 1 ? "e" : ""}
                </span>
            </div>

            {/* Encounter-Liste */}
            {encounters.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                    Keine Aufenthalte vorhanden.
                </p>
            ) : (
                <div className="space-y-2">
                    {encounters.map((enc) => (
                        <EncounterRow key={enc.id} encounter={enc} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1 text-sm rounded border border-slate-200 disabled:opacity-40"
                    >
                        ← Zurück
                    </button>
                    <span className="text-sm text-slate-500">
                        Seite {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="px-3 py-1 text-sm rounded border border-slate-200 disabled:opacity-40"
                    >
                        Weiter →
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Row ──────────────────────────────────────────────────────

function EncounterRow({ encounter }: { encounter: Encounter }) {
    return (
        <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
            <Badge variant={statusVariant[encounter.status]}>
                {ENCOUNTER_STATUS_LABELS[encounter.status]}
            </Badge>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">
                        {ENCOUNTER_TYPE_LABELS[encounter.encounter_type]}
                    </span>
                    {encounter.ward && (
                        <span className="text-xs text-slate-500">
                            Station {encounter.ward}{encounter.bed ? ` / Bett ${encounter.bed}` : ""}
                        </span>
                    )}
                </div>
                <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                    <span>Aufnahme: {formatDate(encounter.admitted_at)}</span>
                    {encounter.discharged_at && (
                        <span>Entlassung: {formatDate(encounter.discharged_at)}</span>
                    )}
                    <span>Dauer: {duration(encounter.admitted_at, encounter.discharged_at)}</span>
                </div>
            </div>
            {encounter.reason && (
                <p className="text-xs text-slate-500 max-w-xs truncate">{encounter.reason}</p>
            )}
        </div>
    );
}
