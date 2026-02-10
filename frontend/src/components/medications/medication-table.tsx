"use client";

import { useMedications, useDiscontinueMedication, type Medication } from "@/hooks/use-medications";
import { Badge, Spinner } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface MedicationTableProps {
    patientId: string;
    onAdminister?: (medication: Medication) => void;
    onEdit?: (medication: Medication) => void;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" }> = {
    active: { label: "Aktiv", variant: "success" },
    paused: { label: "Pausiert", variant: "warning" },
    discontinued: { label: "Abgesetzt", variant: "danger" },
    completed: { label: "Abgeschlossen", variant: "default" },
};

const ROUTE_LABELS: Record<string, string> = {
    "oral": "p.o.",
    "iv": "i.v.",
    "sc": "s.c.",
    "im": "i.m.",
    "topisch": "topisch",
    "inhalativ": "inhal.",
    "rektal": "rektal",
    "sublingual": "s.l.",
};

export function MedicationTable({ patientId, onAdminister, onEdit }: MedicationTableProps) {
    const { data, isLoading, error } = useMedications(patientId);
    const discontinueMutation = useDiscontinueMedication(patientId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <p className="text-sm text-red-500 py-4 text-center">Fehler beim Laden der Medikamente</p>;
    }

    if (!data?.items?.length) {
        return <p className="text-sm text-slate-400 py-8 text-center">Keine Medikamente verordnet.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-3 font-medium text-slate-500">Medikament</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-500">Dosierung</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-500">Weg</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-500">Frequenz</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-500">Zeitraum</th>
                        <th className="text-left py-3 px-3 font-medium text-slate-500">Status</th>
                        <th className="text-right py-3 px-3 font-medium text-slate-500">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((med) => {
                        const statusInfo = STATUS_LABELS[med.status] ?? { label: med.status, variant: "default" as const };
                        return (
                            <tr
                                key={med.id}
                                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                            >
                                <td className="py-3 px-3">
                                    <div>
                                        <p className="font-medium text-slate-900">{med.name}</p>
                                        {med.generic_name && (
                                            <p className="text-xs text-slate-400">{med.generic_name}</p>
                                        )}
                                        {med.is_prn && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">
                                                Bei Bedarf
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-3 text-slate-700">
                                    {med.dose} {med.dose_unit}
                                </td>
                                <td className="py-3 px-3 text-slate-600">
                                    {ROUTE_LABELS[med.route] ?? med.route}
                                </td>
                                <td className="py-3 px-3 text-slate-700">{med.frequency}</td>
                                <td className="py-3 px-3 text-slate-600 text-xs">
                                    {formatDate(med.start_date)}
                                    {med.end_date ? ` – ${formatDate(med.end_date)}` : " – laufend"}
                                </td>
                                <td className="py-3 px-3">
                                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                </td>
                                <td className="py-3 px-3 text-right">
                                    <div className="flex gap-1 justify-end">
                                        {med.status === "active" && onAdminister && (
                                            <button
                                                onClick={() => onAdminister(med)}
                                                className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                                title="Verabreichung dokumentieren"
                                            >
                                                Geben
                                            </button>
                                        )}
                                        {med.status === "active" && onEdit && (
                                            <button
                                                onClick={() => onEdit(med)}
                                                className="px-2 py-1 text-xs rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                            >
                                                Bearbeiten
                                            </button>
                                        )}
                                        {med.status === "active" && (
                                            <button
                                                onClick={() => {
                                                    if (confirm(`${med.name} wirklich absetzen?`)) {
                                                        discontinueMutation.mutate({ id: med.id });
                                                    }
                                                }}
                                                disabled={discontinueMutation.isPending}
                                                className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                Absetzen
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
