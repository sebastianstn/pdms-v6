"use client";

import { Badge, Spinner } from "@/components/ui";
import {
    useActiveEncounter,
    useDischargePatient,
    useTransferPatient,
    useCancelEncounter,
    ENCOUNTER_TYPE_LABELS,
    ENCOUNTER_STATUS_LABELS,
    type EncounterStatus,
} from "@/hooks/use-encounters";
import { useState } from "react";

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

// ─── Props ────────────────────────────────────────────────────

interface EncounterBannerProps {
    patientId: string;
    onAdmit?: () => void;
}

// ─── Component ────────────────────────────────────────────────

export function EncounterBanner({ patientId, onAdmit }: EncounterBannerProps) {
    const { data: encounter, isLoading } = useActiveEncounter(patientId);
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferWard, setTransferWard] = useState("");
    const [transferBed, setTransferBed] = useState("");
    const [dischargeReason, setDischargeReason] = useState("");
    const [showDischarge, setShowDischarge] = useState(false);

    const dischargeMut = useDischargePatient(encounter?.id ?? "");
    const transferMut = useTransferPatient(encounter?.id ?? "");
    const cancelMut = useCancelEncounter(encounter?.id ?? "");

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-200">
                <Spinner size="sm" />
                <span className="text-xs text-slate-500">Encounter laden…</span>
            </div>
        );
    }

    // Kein aktiver Encounter
    if (!encounter) {
        return (
            <div className="flex items-center justify-between px-2 py-0.5 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                    <span className="text-amber-600 font-bold">!</span>
                    <span className="text-xs text-amber-700">Kein aktiver Aufenthalt</span>
                </div>
                {onAdmit && (
                    <button
                        onClick={onAdmit}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        Aufnahme starten
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="px-2 py-1 bg-green-50/50 rounded-lg border border-green-200 space-y-1">
            {/* Header */}
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <Badge variant={statusVariant[encounter.status]}>
                        {ENCOUNTER_STATUS_LABELS[encounter.status]}
                    </Badge>
                    <span className="text-xs font-medium text-slate-700">
                        {ENCOUNTER_TYPE_LABELS[encounter.encounter_type]}
                    </span>
                    {encounter.ward && (
                        <span className="text-xs text-slate-500">
                            Station: <strong>{encounter.ward}</strong>
                            {encounter.bed ? ` / Bett ${encounter.bed}` : ""}
                        </span>
                    )}
                    {encounter.reason && (
                        <span className="text-xs leading-tight text-slate-600 truncate max-w-[40ch]" title={encounter.reason}>
                            · {encounter.reason}
                        </span>
                    )}
                </div>
                <span className="text-xs text-slate-500 self-start sm:self-auto">
                    Aufnahme: {formatDate(encounter.admitted_at)}
                </span>
            </div>

            {/* Aktions-Buttons */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setShowTransfer((v) => !v)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                    Verlegen
                </button>
                <button
                    onClick={() => setShowDischarge((v) => !v)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                    Entlassen
                </button>
                <button
                    onClick={() => {
                        if (confirm("Encounter wirklich abbrechen?")) {
                            cancelMut.mutate();
                        }
                    }}
                    disabled={cancelMut.isPending}
                    className="px-2.5 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                    ✕ Abbrechen
                </button>
            </div>

            {/* Transfer-Formular */}
            {showTransfer && (
                <div className="flex items-end gap-2 p-3 bg-white rounded-lg border border-slate-200">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Neue Station *</label>
                        <input
                            type="text"
                            value={transferWard}
                            onChange={(e) => setTransferWard(e.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm w-32"
                            placeholder="z.B. IPS-2"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Bett</label>
                        <input
                            type="text"
                            value={transferBed}
                            onChange={(e) => setTransferBed(e.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm w-20"
                            placeholder="z.B. 3a"
                        />
                    </div>
                    <button
                        onClick={() =>
                            transferMut.mutate(
                                { ward: transferWard, bed: transferBed || undefined },
                                {
                                    onSuccess: () => {
                                        setShowTransfer(false);
                                        setTransferWard("");
                                        setTransferBed("");
                                    },
                                },
                            )
                        }
                        disabled={!transferWard.trim() || transferMut.isPending}
                        className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {transferMut.isPending ? "…" : "Verlegen"}
                    </button>
                    <button
                        onClick={() => setShowTransfer(false)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        Abbrechen
                    </button>
                </div>
            )}

            {/* Entlass-Formular */}
            {showDischarge && (
                <div className="flex items-end gap-2 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex-1">
                        <label className="block text-xs text-slate-500 mb-1">Entlassgrund (optional)</label>
                        <input
                            type="text"
                            value={dischargeReason}
                            onChange={(e) => setDischargeReason(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                            placeholder="z.B. Besserung, Verlegung externes Spital"
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={() =>
                            dischargeMut.mutate(
                                { discharge_reason: dischargeReason || undefined },
                                {
                                    onSuccess: () => {
                                        setShowDischarge(false);
                                        setDischargeReason("");
                                    },
                                },
                            )
                        }
                        disabled={dischargeMut.isPending}
                        className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                        {dischargeMut.isPending ? "…" : "Entlassen"}
                    </button>
                    <button
                        onClick={() => setShowDischarge(false)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        Abbrechen
                    </button>
                </div>
            )}
        </div>
    );
}
