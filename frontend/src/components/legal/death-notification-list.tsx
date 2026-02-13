"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui";
import {
    useDeathNotifications,
    useCreateDeathNotification,
    useDeleteDeathNotification,
} from "@/hooks/use-directives";
import type { DeathNotificationCreate } from "@pdms/shared-types";

interface DeathNotificationListProps {
    patientId: string;
}

export function DeathNotificationList({ patientId }: DeathNotificationListProps) {
    const { data: notifications, isLoading } = useDeathNotifications(patientId);
    const [showForm, setShowForm] = useState(false);
    const createMut = useCreateDeathNotification();
    const deleteMut = useDeleteDeathNotification(patientId);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>;

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: DeathNotificationCreate = {
            patient_id: patientId,
            contact_name: fd.get("contact_name") as string,
            contact_phone: (fd.get("contact_phone") as string) || undefined,
            contact_email: (fd.get("contact_email") as string) || undefined,
            contact_role: (fd.get("contact_role") as string) || undefined,
            priority: Number(fd.get("priority")) || 1,
            instructions: (fd.get("instructions") as string) || undefined,
        };
        createMut.mutate(data, { onSuccess: () => setShowForm(false) });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Todesfall-Mitteilungen</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    {showForm ? "Abbrechen" : "+ Kontakt hinzufügen"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                            <input name="contact_name" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Telefon</label>
                            <input name="contact_phone" type="tel" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">E-Mail</label>
                            <input name="contact_email" type="email" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Rolle</label>
                            <input name="contact_role" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="z.B. Tochter, Seelsorger, Bestatter" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Priorität</label>
                            <select name="priority" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                                <option value="1">1 — Sofort</option>
                                <option value="2">2 — Innerhalb 1h</option>
                                <option value="3">3 — Innerhalb 24h</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Anweisungen</label>
                            <input name="instructions" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="z.B. Nur telefonisch kontaktieren" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Abbrechen</button>
                        <button type="submit" disabled={createMut.isPending} className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {createMut.isPending ? "Speichern..." : "Hinzufügen"}
                        </button>
                    </div>
                </form>
            )}

            {notifications && notifications.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Keine Kontakte für Todesfall-Mitteilungen hinterlegt.</p>
            )}

            {notifications && notifications.length > 0 && (
                <div className="space-y-2">
                    {notifications
                        .sort((a, b) => a.priority - b.priority)
                        .map((n) => (
                            <div key={n.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-200">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${n.priority === 1 ? "bg-red-100 text-red-700" :
                                    n.priority === 2 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                    }`}>
                                    {n.priority}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-slate-900">{n.contact_name}</span>
                                        {n.contact_role && <span className="text-xs text-slate-400">({n.contact_role})</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        {n.contact_phone && <span>Tel. {n.contact_phone}</span>}
                                        {n.contact_email && <span>✉ {n.contact_email}</span>}
                                        {n.instructions && <span className="italic">{n.instructions}</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { if (confirm("Kontakt entfernen?")) deleteMut.mutate(n.id); }}
                                    className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                    Entfernen
                                </button>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
