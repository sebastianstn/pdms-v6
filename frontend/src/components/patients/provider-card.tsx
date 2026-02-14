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
                        <input name="name" required placeholder="Name / Praxis *" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" autoFocus />
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
                <p className="text-xs text-slate-500 text-center py-4">Keine Zuweiser erfasst.</p>
            )}

            {providers && providers.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{p.name}</span>
                            <Badge variant="default">{PROVIDER_TYPE_LABELS[p.provider_type]}</Badge>
                            {p.speciality && <span className="text-xs text-slate-500">{p.speciality}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            {p.contact_person && <span className="inline-flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {p.contact_person}</span>}
                            {p.phone && <span className="inline-flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> {p.phone}</span>}
                            {p.email && <span>{p.email}</span>}
                            {p.hin_email && <span className="inline-flex items-center gap-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> HIN: {p.hin_email}</span>}
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
