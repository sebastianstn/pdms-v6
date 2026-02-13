"use client";

import { useState } from "react";
import { Badge, Spinner } from "@/components/ui";
import {
    useContacts,
    useCreateContact,
    useDeleteContact,
} from "@/hooks/use-contacts";
import type { ContactCreate } from "@pdms/shared-types";

interface ContactCardProps {
    patientId: string;
}

export function ContactCard({ patientId }: ContactCardProps) {
    const { data: contacts, isLoading } = useContacts(patientId);
    const [showForm, setShowForm] = useState(false);
    const createMut = useCreateContact();
    const deleteMut = useDeleteContact(patientId);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>;

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: ContactCreate = {
            patient_id: patientId,
            name: fd.get("name") as string,
            relationship_type: fd.get("relationship_type") as string,
            phone: fd.get("phone") as string,
            is_primary: fd.get("is_primary") === "on",
            email: (fd.get("email") as string) || undefined,
            address: (fd.get("address") as string) || undefined,
            is_legal_representative: fd.get("is_legal_representative") === "on",
            is_key_person: fd.get("is_key_person") === "on",
            notes: (fd.get("notes") as string) || undefined,
        };
        createMut.mutate(data, { onSuccess: () => setShowForm(false) });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Kontaktpersonen</h3>
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
                        <input name="name" required placeholder="Name *" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="relationship_type" required placeholder="Beziehung * (z.B. Ehepartner)" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="phone" required placeholder="Telefon *" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="email" type="email" placeholder="E-Mail" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="address" placeholder="Adresse" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input name="notes" placeholder="Bemerkungen" className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input name="is_primary" type="checkbox" className="rounded border-slate-300" />
                            Hauptkontakt
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input name="is_legal_representative" type="checkbox" className="rounded border-slate-300" />
                            Gesetzl. Vertreter
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input name="is_key_person" type="checkbox" className="rounded border-slate-300" />
                            Bezugsperson
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">Abbrechen</button>
                        <button type="submit" disabled={createMut.isPending} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Speichern</button>
                    </div>
                </form>
            )}

            {contacts && contacts.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Keine Kontaktpersonen erfasst.</p>
            )}

            {contacts && contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{c.name}</span>
                            <span className="text-xs text-slate-400">({c.relationship_type})</span>
                            {c.is_primary && <Badge variant="info">Hauptkontakt</Badge>}
                            {c.is_legal_representative && <Badge variant="warning">Gesetzl. Vertreter</Badge>}
                            {c.is_key_person && <Badge variant="success">Bezugsperson</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>{c.phone}</span>
                            {c.email && <span>{c.email}</span>}
                            {c.address && <span>{c.address}</span>}
                        </div>
                        {c.notes && <p className="text-xs text-slate-400 mt-1">{c.notes}</p>}
                    </div>
                    <button
                        onClick={() => { if (confirm("Kontakt löschen?")) deleteMut.mutate(c.id); }}
                        className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}

