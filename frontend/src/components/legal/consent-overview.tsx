"use client";

import { useState } from "react";
import { Badge, Spinner } from "@/components/ui";
import {
    useConsents,
    useCreateConsent,
    useRevokeConsent,
    useDeleteConsent,
} from "@/hooks/use-consents";
import type { ConsentCreate, ConsentType } from "@pdms/shared-types";
import { CONSENT_TYPE_LABELS, CONSENT_STATUS_LABELS } from "@pdms/shared-types";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger"> = {
    pending: "warning",
    granted: "success",
    refused: "danger",
    revoked: "default",
};

function fmtDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

interface ConsentOverviewProps {
    patientId: string;
}

export function ConsentOverview({ patientId }: ConsentOverviewProps) {
    const { data: consents, isLoading, error } = useConsents(patientId);
    const [showForm, setShowForm] = useState(false);
    const revokeMut = useRevokeConsent(patientId);
    const deleteMut = useDeleteConsent(patientId);
    const createMut = useCreateConsent();

    if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
    if (error) return <p className="text-sm text-red-500 text-center py-4">Fehler beim Laden.</p>;

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: ConsentCreate = {
            patient_id: patientId,
            consent_type: fd.get("consent_type") as ConsentType,
            granted_by: (fd.get("granted_by") as string) || undefined,
            witness_name: (fd.get("witness_name") as string) || undefined,
            notes: (fd.get("notes") as string) || undefined,
        };
        createMut.mutate(data, { onSuccess: () => setShowForm(false) });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Einwilligungen</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    {showForm ? "Abbrechen" : "+ Neue Einwilligung"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Typ *</label>
                            <select name="consent_type" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                                {Object.entries(CONSENT_TYPE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Erteilt durch</label>
                            <input name="granted_by" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="Name / Funktion" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Zeuge</label>
                            <input name="witness_name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Bemerkungen</label>
                            <input name="notes" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Abbrechen</button>
                        <button type="submit" disabled={createMut.isPending} className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {createMut.isPending ? "Speichern..." : "Einwilligung erfassen"}
                        </button>
                    </div>
                </form>
            )}

            {/* Required consents overview */}
            {consents && consents.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                    Noch keine Einwilligungen erfasst. Bitte alle erforderlichen Einwilligungen einholen.
                </div>
            )}

            {consents && consents.length > 0 && (
                <div className="space-y-2">
                    {consents.map((c) => (
                        <div key={c.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-slate-900">
                                        {CONSENT_TYPE_LABELS[c.consent_type] ?? c.consent_type}
                                    </span>
                                    <Badge variant={STATUS_VARIANT[c.status] ?? "default"}>
                                        {CONSENT_STATUS_LABELS[c.status as keyof typeof CONSENT_STATUS_LABELS] ?? c.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    {c.granted_by && <span>Erteilt: {c.granted_by}</span>}
                                    {c.granted_at && <span>{fmtDate(c.granted_at)}</span>}
                                    {c.valid_until && <span>Gültig bis: {fmtDate(c.valid_until)}</span>}
                                    {c.witness_name && <span>Zeuge: {c.witness_name}</span>}
                                </div>
                                {c.revoked_at && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Widerrufen am {fmtDate(c.revoked_at)}{c.revoked_reason ? `: ${c.revoked_reason}` : ""}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-1">
                                {c.status === "granted" && (
                                    <button
                                        onClick={() => {
                                            const reason = prompt("Grund für Widerruf:");
                                            if (reason !== null) revokeMut.mutate({ id: c.id, reason });
                                        }}
                                        className="px-2 py-1 text-xs rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    >
                                        Widerrufen
                                    </button>
                                )}
                                {c.status !== "granted" && (
                                    <button
                                        onClick={() => {
                                            if (confirm("Einwilligung löschen?")) deleteMut.mutate(c.id);
                                        }}
                                        className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                                    >
                                        Löschen
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
