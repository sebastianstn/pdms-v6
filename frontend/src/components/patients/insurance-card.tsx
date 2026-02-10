"use client";

import { useState } from "react";
import { Badge, Spinner } from "@/components/ui";
import {
    useInsurances,
    useCreateInsurance,
    useUpdateInsurance,
    useDeleteInsurance,
} from "@/hooks/use-insurance";
import type { InsuranceCreate, InsuranceType } from "@pdms/shared-types";

const TYPE_LABELS: Record<InsuranceType, string> = {
    grundversicherung: "Grundversicherung",
    zusatz: "Zusatzversicherung",
    unfall: "Unfallversicherung",
    iv: "Invalidenversicherung",
};

function fmtDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface InsuranceCardProps {
    patientId: string;
}

export function InsuranceCard({ patientId }: InsuranceCardProps) {
    const { data: insurances, isLoading } = useInsurances(patientId);
    const [showForm, setShowForm] = useState(false);
    const createMut = useCreateInsurance();
    const deleteMut = useDeleteInsurance(patientId);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>;

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: InsuranceCreate = {
            patient_id: patientId,
            insurer_name: fd.get("insurer_name") as string,
            policy_number: fd.get("policy_number") as string,
            insurance_type: fd.get("insurance_type") as InsuranceType,
            valid_from: (fd.get("valid_from") as string) || undefined,
            valid_until: (fd.get("valid_until") as string) || undefined,
            franchise: fd.get("franchise") ? Number(fd.get("franchise")) : undefined,
            kostengutsprache: fd.get("kostengutsprache") === "on",
            garant: (fd.get("garant") as string) || undefined,
            bvg_number: (fd.get("bvg_number") as string) || undefined,
            notes: (fd.get("notes") as string) || undefined,
        };
        createMut.mutate(data, { onSuccess: () => setShowForm(false) });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Versicherungen</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    {showForm ? "Abbrechen" : "+ Hinzufügen"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input name="insurer_name" required placeholder="Versicherer *" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="policy_number" required placeholder="Policen-Nr. *" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <select name="insurance_type" required className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                            {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <input name="franchise" type="number" placeholder="Franchise (CHF)" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <select name="garant" className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                            <option value="">Garant wählen...</option>
                            <option value="patient">Patient</option>
                            <option value="versicherung">Versicherung</option>
                            <option value="kanton">Kanton</option>
                        </select>
                        <input name="bvg_number" placeholder="BVG-Nr." className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input name="kostengutsprache" type="checkbox" className="rounded border-slate-300" />
                            Kostengutsprache vorhanden
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">Abbrechen</button>
                        <button type="submit" disabled={createMut.isPending} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Speichern</button>
                    </div>
                </form>
            )}

            {insurances && insurances.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Keine Versicherungen erfasst.</p>
            )}

            {insurances && insurances.map((ins) => (
                <div key={ins.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{ins.insurer_name}</span>
                            <Badge variant="default">{TYPE_LABELS[ins.insurance_type]}</Badge>
                            {ins.kostengutsprache && <Badge variant="success">KG</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>Nr. {ins.policy_number}</span>
                            {ins.franchise && <span>Franchise: {ins.franchise} CHF</span>}
                            {ins.garant && <span>Garant: {ins.garant}</span>}
                            <span>Gültig: {fmtDate(ins.valid_from)} – {fmtDate(ins.valid_until)}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { if (confirm("Versicherung löschen?")) deleteMut.mutate(ins.id); }}
                        className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
