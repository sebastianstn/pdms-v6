"use client";

import {
    useNursingEntries,
    useDeleteNursingEntry,
    type NursingEntry,
    type EntryCategory,
} from "@/hooks/use-nursing";
import { Badge, Spinner } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

interface NursingEntryListProps {
    patientId: string;
    category?: string;
    handoverOnly?: boolean;
    onEdit?: (entry: NursingEntry) => void;
}

const CATEGORY_LABELS: Record<EntryCategory, { label: string; color: string }> = {
    observation: { label: "Beobachtung", color: "bg-blue-100 text-blue-700" },
    intervention: { label: "Intervention", color: "bg-green-100 text-green-700" },
    assessment: { label: "Assessment", color: "bg-purple-100 text-purple-700" },
    handover: { label: "Übergabe", color: "bg-amber-100 text-amber-700" },
    wound_care: { label: "Wundversorgung", color: "bg-red-100 text-red-700" },
    mobility: { label: "Mobilisation", color: "bg-teal-100 text-teal-700" },
    nutrition: { label: "Ernährung", color: "bg-orange-100 text-orange-700" },
    elimination: { label: "Ausscheidung", color: "bg-slate-100 text-slate-700" },
    communication: { label: "Kommunikation", color: "bg-cyan-100 text-cyan-700" },
};

const PRIORITY_BADGES: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" }> = {
    low: { label: "Niedrig", variant: "default" },
    normal: { label: "Normal", variant: "success" },
    high: { label: "Hoch", variant: "warning" },
    urgent: { label: "Dringend", variant: "danger" },
};

export function NursingEntryList({ patientId, category, handoverOnly, onEdit }: NursingEntryListProps) {
    const { data, isLoading, error } = useNursingEntries(patientId, { category, handoverOnly });
    const deleteMutation = useDeleteNursingEntry(patientId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <p className="text-sm text-red-500 py-4 text-center">Fehler beim Laden der Pflegeeinträge</p>;
    }

    if (!data?.items?.length) {
        return <p className="text-sm text-slate-400 py-8 text-center">Keine Pflegeeinträge vorhanden.</p>;
    }

    return (
        <div className="space-y-3">
            {data.items.map((entry) => {
                const cat = CATEGORY_LABELS[entry.category] || { label: entry.category, color: "bg-slate-100 text-slate-700" };
                const prio = PRIORITY_BADGES[entry.priority];

                return (
                    <div
                        key={entry.id}
                        className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cat.color}`}>
                                    {cat.label}
                                </span>
                                {prio && <Badge variant={prio.variant}>{prio.label}</Badge>}
                                {entry.is_handover && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                        Übergabe
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                {formatDateTime(entry.recorded_at)}
                            </span>
                        </div>

                        {/* Title + Content */}
                        <h4 className="font-medium text-slate-900 mt-2">{entry.title}</h4>
                        <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{entry.content}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(entry)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    Bearbeiten
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (confirm("Pflegeeintrag wirklich löschen?")) {
                                        deleteMutation.mutate(entry.id);
                                    }
                                }}
                                className="text-xs text-red-500 hover:text-red-700"
                                disabled={deleteMutation.isPending}
                            >
                                Löschen
                            </button>
                        </div>
                    </div>
                );
            })}

            {data.total > data.items.length && (
                <p className="text-xs text-slate-400 text-center pt-2">
                    {data.items.length} von {data.total} Einträgen angezeigt
                </p>
            )}
        </div>
    );
}
