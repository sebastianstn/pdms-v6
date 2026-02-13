"use client";

import { useState } from "react";
import { Badge, Spinner } from "@/components/ui";
import {
    useAppointments,
    useCreateAppointment,
    useCancelAppointment,
    useCompleteAppointment,
    useDeleteAppointment,
} from "@/hooks/use-appointments";
import type {
    Appointment,
    AppointmentCreate,
    AppointmentType,
    AppointmentStatus,
} from "@pdms/shared-types";
import {
    APPOINTMENT_TYPE_LABELS,
    APPOINTMENT_STATUS_LABELS,
} from "@pdms/shared-types";

// ─── Helpers ──────────────────────────────────────────────────

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

const STATUS_VARIANT: Record<
    AppointmentStatus,
    "default" | "success" | "warning" | "danger" | "info"
> = {
    planned: "info",
    confirmed: "default",
    in_progress: "warning",
    completed: "success",
    cancelled: "danger",
    no_show: "danger",
};

// ─── Main Component ───────────────────────────────────────────

interface AppointmentListProps {
    patientId: string;
}

export function AppointmentList({ patientId }: AppointmentListProps) {
    const [showForm, setShowForm] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");

    const { data: appointments, isLoading, error } = useAppointments(patientId, {
        appointment_type: typeFilter || undefined,
        status: statusFilter || undefined,
    });

    const cancelMut = useCancelAppointment(patientId);
    const completeMut = useCompleteAppointment(patientId);
    const deleteMut = useDeleteAppointment(patientId);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                    <option value="">Alle Typen</option>
                    {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                    <option value="">Alle Status</option>
                    {Object.entries(APPOINTMENT_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>

                <div className="flex-1" />

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    {showForm ? "Abbrechen" : "+ Neuer Termin"}
                </button>
            </div>

            {/* Inline create form */}
            {showForm && (
                <AppointmentForm
                    patientId={patientId}
                    onSuccess={() => setShowForm(false)}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {/* List */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                </div>
            )}

            {error && (
                <p className="text-sm text-red-500 text-center py-4">
                    Fehler beim Laden der Termine.
                </p>
            )}

            {appointments && appointments.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">
                    Keine Termine vorhanden.
                </p>
            )}

            {appointments && appointments.length > 0 && (
                <div className="space-y-2">
                    {appointments.map((appt) => (
                        <AppointmentRow
                            key={appt.id}
                            appointment={appt}
                            onCancel={() => {
                                if (confirm("Termin wirklich absagen?"))
                                    cancelMut.mutate(appt.id);
                            }}
                            onComplete={() => completeMut.mutate(appt.id)}
                            onDelete={() => {
                                if (confirm("Termin endgültig löschen?"))
                                    deleteMut.mutate(appt.id);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Row ──────────────────────────────────────────────────────

function AppointmentRow({
    appointment,
    onCancel,
    onComplete,
    onDelete,
}: {
    appointment: Appointment;
    onCancel: () => void;
    onComplete: () => void;
    onDelete: () => void;
}) {
    const a = appointment;
    const statusInfo = STATUS_VARIANT[a.status] ?? "default";

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
            {/* Date/Time */}
            <div className="min-w-[80px] text-center">
                <div className="text-lg font-bold text-slate-900">
                    {fmtDate(a.scheduled_date).slice(0, 5)}
                </div>
                <div className="text-xs text-slate-500">{fmtTime(a.start_time)}</div>
                <div className="text-[10px] text-slate-400">{a.duration_minutes} Min.</div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">{a.title}</span>
                    <Badge variant={statusInfo}>
                        {APPOINTMENT_STATUS_LABELS[a.status]}
                    </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{APPOINTMENT_TYPE_LABELS[a.appointment_type]}</span>
                    {a.location && <span>{a.location}</span>}
                    {a.assigned_name && <span>{a.assigned_name}</span>}
                    {a.transport_required && <span>Transport</span>}
                    {a.is_recurring && <span>Wiederkehrend</span>}
                </div>
                {a.notes && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{a.notes}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-1">
                {(a.status === "planned" || a.status === "confirmed") && (
                    <>
                        <button
                            onClick={onComplete}
                            className="px-2 py-1 text-xs rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                            Erledigt
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-2 py-1 text-xs rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                            Absagen
                        </button>
                    </>
                )}
                {(a.status === "cancelled" || a.status === "completed") && (
                    <button
                        onClick={onDelete}
                        className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                        Löschen
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Create Form ──────────────────────────────────────────────

function AppointmentForm({
    patientId,
    onSuccess,
    onCancel,
}: {
    patientId: string;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const createMut = useCreateAppointment();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);

        const data: AppointmentCreate = {
            patient_id: patientId,
            appointment_type: fd.get("appointment_type") as AppointmentType,
            title: fd.get("title") as string,
            description: (fd.get("description") as string) || undefined,
            location: (fd.get("location") as string) || undefined,
            scheduled_date: fd.get("scheduled_date") as string,
            start_time: new Date(
                `${fd.get("scheduled_date")}T${fd.get("start_time")}`,
            ).toISOString(),
            duration_minutes: Number(fd.get("duration_minutes")) || 30,
            assigned_name: (fd.get("assigned_name") as string) || undefined,
            transport_required: fd.get("transport_required") === "on",
            notes: (fd.get("notes") as string) || undefined,
        };

        createMut.mutate(data, { onSuccess });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 space-y-3"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Typ *</label>
                    <select name="appointment_type" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                        {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Titel *</label>
                    <input name="title" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="z.B. IV-Antibiotika Tag 5" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Datum *</label>
                    <input name="scheduled_date" type="date" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Uhrzeit *</label>
                    <input name="start_time" type="time" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Dauer (Min.)</label>
                    <input name="duration_minutes" type="number" defaultValue={30} min={5} step={5} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Ort</label>
                    <input name="location" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="z.B. Zu Hause" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Zugewiesen an</label>
                    <input name="assigned_name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="z.B. Dr. Müller" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                    <input name="transport_required" type="checkbox" id="transport" className="rounded border-slate-300" />
                    <label htmlFor="transport" className="text-sm text-slate-600">Transport nötig</label>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Beschreibung</label>
                <textarea name="description" rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    Abbrechen
                </button>
                <button type="submit" disabled={createMut.isPending} className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {createMut.isPending ? "Speichern..." : "Termin erstellen"}
                </button>
            </div>
        </form>
    );
}
