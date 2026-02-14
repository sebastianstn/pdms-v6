"use client";

/**
 * DiagnosisList — Zeigt alle Diagnosen eines Patienten an.
 */

import { useDiagnoses, useDeleteDiagnosis, useUpdateDiagnosis } from "@/hooks/use-diagnoses";
import { Spinner } from "@/components/ui";
import {
    DIAGNOSIS_TYPE_LABELS,
    DIAGNOSIS_STATUS_LABELS,
    DIAGNOSIS_SEVERITY_LABELS,
    type DiagnosisStatus,
    type DiagnosisType,
    type DiagnosisSeverity,
} from "@pdms/shared-types";

interface Props {
    patientId: string;
    statusFilter?: DiagnosisStatus;
}

function statusColor(status: DiagnosisStatus): string {
    switch (status) {
        case "active":
            return "bg-emerald-100 text-emerald-800";
        case "resolved":
            return "bg-blue-100 text-blue-800";
        case "ruled_out":
            return "bg-slate-100 text-slate-600";
        case "recurrence":
            return "bg-amber-100 text-amber-800";
    }
}

function typeColor(t: DiagnosisType): string {
    switch (t) {
        case "haupt":
            return "bg-red-100 text-red-700";
        case "neben":
            return "bg-orange-100 text-orange-700";
        case "verdacht":
            return "bg-yellow-100 text-yellow-700";
    }
}

function severityBadge(s: DiagnosisSeverity): string {
    switch (s) {
        case "schwer":
            return "bg-red-50 text-red-600";
        case "mittel":
            return "bg-amber-50 text-amber-600";
        case "leicht":
            return "bg-green-50 text-green-600";
    }
}

export function DiagnosisList({ patientId, statusFilter }: Props) {
    const { data, isLoading, isError } = useDiagnoses(patientId, {
        status: statusFilter,
    });
    const deleteMutation = useDeleteDiagnosis();

    if (isLoading)
        return (
            <div className="flex justify-center py-8">
                <Spinner size="sm" />
            </div>
        );
    if (isError)
        return (
            <p className="text-sm text-red-600 text-center py-4">
                Diagnosen konnten nicht geladen werden.
            </p>
        );

    const diagnoses = data?.items ?? [];
    if (diagnoses.length === 0) {
        return (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                Keine Diagnosen vorhanden.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {diagnoses.map((diag) => (
                <div
                    key={diag.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">
                                    {diag.title}
                                </h4>
                                {diag.icd_code && (
                                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-medium">
                                        {diag.icd_code}
                                    </span>
                                )}
                            </div>
                            {diag.description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {diag.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor(diag.diagnosis_type)}`}
                            >
                                {DIAGNOSIS_TYPE_LABELS[diag.diagnosis_type]}
                            </span>
                            {diag.severity && (
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityBadge(diag.severity)}`}
                                >
                                    {DIAGNOSIS_SEVERITY_LABELS[diag.severity]}
                                </span>
                            )}
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(diag.status)}`}
                            >
                                {DIAGNOSIS_STATUS_LABELS[diag.status]}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {diag.onset_date && <span>Beginn: {diag.onset_date}</span>}
                        {diag.body_site && <span>Lokalisation: {diag.body_site}</span>}
                        {diag.laterality && <span>Seite: {diag.laterality}</span>}
                        <span>
                            Diagnostiziert:{" "}
                            {new Date(diag.diagnosed_at).toLocaleDateString("de-CH", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}
                        </span>
                    </div>

                    {diag.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">
                            {diag.notes}
                        </p>
                    )}

                    {/* Aktionen */}
                    <div className="mt-3 flex justify-end gap-3">
                        {diag.status === "active" && (
                            <StatusButton diagnosisId={diag.id} />
                        )}
                        <button
                            onClick={() => {
                                if (confirm("Diagnose wirklich löschen?")) {
                                    deleteMutation.mutate(diag.id);
                                }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                            Löschen
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Button zum Markieren als "behoben". */
function StatusButton({ diagnosisId }: { diagnosisId: string }) {
    const updateMutation = useUpdateDiagnosis(diagnosisId);
    return (
        <button
            onClick={() =>
                updateMutation.mutate({
                    status: "resolved",
                    resolved_date: new Date().toISOString().split("T")[0],
                })
            }
            disabled={updateMutation.isPending}
            className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
            Als behoben markieren
        </button>
    );
}
