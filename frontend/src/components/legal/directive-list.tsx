"use client";

import { useState } from "react";
import { Badge, Spinner } from "@/components/ui";
import {
    useDirectives,
    useCreateDirective,
    useDeleteDirective,
} from "@/hooks/use-directives";
import type { DirectiveCreate, DirectiveType, ReaStatus } from "@pdms/shared-types";
import { DIRECTIVE_TYPE_LABELS } from "@pdms/shared-types";

function fmtDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface DirectiveListProps {
    patientId: string;
}

export function DirectiveList({ patientId }: DirectiveListProps) {
    const { data: directives, isLoading } = useDirectives(patientId);
    const [showForm, setShowForm] = useState(false);
    const createMut = useCreateDirective();
    const deleteMut = useDeleteDirective(patientId);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner size="lg" /></div>;

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: DirectiveCreate = {
            patient_id: patientId,
            directive_type: fd.get("directive_type") as DirectiveType,
            rea_status: fd.get("rea_status") as ReaStatus,
            intensive_care: fd.get("intensive_care") === "on",
            mechanical_ventilation: fd.get("mechanical_ventilation") === "on",
            dialysis: fd.get("dialysis") === "on",
            artificial_nutrition: fd.get("artificial_nutrition") === "on",
            trusted_person_name: (fd.get("trusted_person_name") as string) || undefined,
            trusted_person_phone: (fd.get("trusted_person_phone") as string) || undefined,
            document_date: (fd.get("document_date") as string) || undefined,
            storage_location: (fd.get("storage_location") as string) || undefined,
            notes: (fd.get("notes") as string) || undefined,
        };
        createMut.mutate(data, { onSuccess: () => setShowForm(false) });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Patientenverfügungen & Vorsorgeaufträge</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    {showForm ? "Abbrechen" : "+ Neue Verfügung"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Typ *</label>
                            <select name="directive_type" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                                {Object.entries(DIRECTIVE_TYPE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">REA-Status *</label>
                            <select name="rea_status" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                                <option value="FULL">FULL (Reanimation)</option>
                                <option value="DNR">DNR (Do Not Resuscitate)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Dokumentdatum</label>
                            <input name="document_date" type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { key: "intensive_care", label: "Intensivmedizin" },
                            { key: "mechanical_ventilation", label: "Beatmung" },
                            { key: "dialysis", label: "Dialyse" },
                            { key: "artificial_nutrition", label: "Künstl. Ernährung" },
                        ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2 text-sm text-slate-600">
                                <input name={key} type="checkbox" className="rounded border-slate-300" />
                                {label}
                            </label>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Vertrauensperson</label>
                            <input name="trusted_person_name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Telefon VP</label>
                            <input name="trusted_person_phone" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Aufbewahrungsort</label>
                            <input name="storage_location" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="z.B. Tresor Station 3A" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Bemerkungen</label>
                            <input name="notes" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Abbrechen</button>
                        <button type="submit" disabled={createMut.isPending} className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {createMut.isPending ? "Speichern..." : "Verfügung erfassen"}
                        </button>
                    </div>
                </form>
            )}

            {directives && directives.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Keine Patientenverfügungen erfasst.</p>
            )}

            {directives && directives.map((d) => (
                <div key={d.id} className="p-4 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{DIRECTIVE_TYPE_LABELS[d.directive_type]}</span>
                            <Badge variant={d.rea_status === "DNR" ? "danger" : "success"}>
                                REA: {d.rea_status}
                            </Badge>
                            {!d.is_valid && <Badge variant="warning">Ungültig</Badge>}
                        </div>
                        <button
                            onClick={() => { if (confirm("Verfügung löschen?")) deleteMut.mutate(d.id); }}
                            className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                        >
                            Löschen
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <span className={d.intensive_care ? "text-green-700" : "text-slate-400"}>
                            {d.intensive_care ? "✓" : "✗"} Intensivmedizin
                        </span>
                        <span className={d.mechanical_ventilation ? "text-green-700" : "text-slate-400"}>
                            {d.mechanical_ventilation ? "✓" : "✗"} Beatmung
                        </span>
                        <span className={d.dialysis ? "text-green-700" : "text-slate-400"}>
                            {d.dialysis ? "✓" : "✗"} Dialyse
                        </span>
                        <span className={d.artificial_nutrition ? "text-green-700" : "text-slate-400"}>
                            {d.artificial_nutrition ? "✓" : "✗"} Künstl. Ernährung
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        {d.trusted_person_name && <span>VP: {d.trusted_person_name} {d.trusted_person_phone}</span>}
                        {d.document_date && <span>Datum: {fmtDate(d.document_date)}</span>}
                        {d.storage_location && <span>Ort: {d.storage_location}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}
