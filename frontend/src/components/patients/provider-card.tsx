"use client";

import { useState } from "react";
import { Badge, Spinner } from "@/components/ui";
import {
    useProviders,
    useCreateProvider,
    useDeleteProvider,
} from "@/hooks/use-providers";
import type { ProviderCreate, ProviderType } from "@pdms/shared-types";
import { PROVIDER_TYPE_LABELS } from "@pdms/shared-types";

interface ProviderCardProps {
    patientId: string;
}

export function ProviderCard({ patientId }: ProviderCardProps) {
    const { data: providers, isLoading } = useProviders(patientId);
    const [showForm, setShowForm] = useState(false);
    const createMut = useCreateProvider();
    const deleteMut = useDeleteProvider(patientId);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>;

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: ProviderCreate = {
            patient_id: patientId,
            provider_type: fd.get("provider_type") as ProviderType,
            name: fd.get("name") as string,
            contact_person: (fd.get("contact_person") as string) || undefined,
            phone: (fd.get("phone") as string) || undefined,
            email: (fd.get("email") as string) || undefined,
            hin_email: (fd.get("hin_email") as string) || undefined,
            gln_number: (fd.get("gln_number") as string) || undefined,
            address: (fd.get("address") as string) || undefined,
            speciality: (fd.get("speciality") as string) || undefined,
            notes: (fd.get("notes") as string) || undefined,
        };
        createMut.mutate(data, { onSuccess: () => setShowForm(false) });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Medizinische Zuweiser</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    {showForm ? "Abbrechen" : "+ Hinzufügen"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <select name="provider_type" required className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                            {Object.entries(PROVIDER_TYPE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <input name="name" required placeholder="Name / Praxis *" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="contact_person" placeholder="Kontaktperson" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="phone" placeholder="Telefon" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="email" type="email" placeholder="E-Mail" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="hin_email" placeholder="HIN-E-Mail" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="gln_number" placeholder="GLN-Nummer" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="address" placeholder="Adresse" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="speciality" placeholder="Fachgebiet" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">Abbrechen</button>
                        <button type="submit" disabled={createMut.isPending} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Speichern</button>
                    </div>
                </form>
            )}

            {providers && providers.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Keine Zuweiser erfasst.</p>
            )}

            {providers && providers.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{p.name}</span>
                            <Badge variant="default">{PROVIDER_TYPE_LABELS[p.provider_type]}</Badge>
                            {p.speciality && <span className="text-xs text-slate-400">{p.speciality}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            {p.contact_person && <span>👤 {p.contact_person}</span>}
                            {p.phone && <span>📞 {p.phone}</span>}
                            {p.email && <span>✉ {p.email}</span>}
                            {p.hin_email && <span>🔒 HIN: {p.hin_email}</span>}
                            {p.gln_number && <span>GLN: {p.gln_number}</span>}
                        </div>
                    </div>
                    <button
                        onClick={() => { if (confirm("Zuweiser löschen?")) deleteMut.mutate(p.id); }}
                        className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
