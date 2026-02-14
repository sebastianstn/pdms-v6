"use client";

import {
    useLatestAssessments,
    type NursingAssessment,
} from "@/hooks/use-nursing";
import { Spinner } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

interface AssessmentOverviewProps {
    patientId: string;
    onNewAssessment?: (type: string) => void;
}

const ASSESSMENT_META: Record<string, { label: string; unit: string }> = {
    barthel: { label: "Barthel-Index", unit: "/ 100" },
    norton: { label: "Norton-Skala", unit: "/ 20" },
    braden: { label: "Braden-Skala", unit: "/ 23" },
    fall_risk: { label: "Sturzrisiko (Morse)", unit: "/ 125" },
    pain: { label: "Schmerz-Assessment", unit: "" },
    nutrition: { label: "Ernährungs-Assessment", unit: "" },
};

const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    low: { bg: "bg-green-100", text: "text-green-700", label: "Gering" },
    medium: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Mittel" },
    high: { bg: "bg-orange-100", text: "text-orange-700", label: "Hoch" },
    very_high: { bg: "bg-red-100", text: "text-red-700", label: "Sehr hoch" },
};

function AssessmentCard({
    assessment,
    type,
    onNew,
}: {
    assessment?: NursingAssessment;
    type: string;
    onNew?: () => void;
}) {
    const meta = ASSESSMENT_META[type] || { label: type, unit: "" };
    const risk = assessment?.risk_level ? RISK_COLORS[assessment.risk_level] : null;

    return (
        <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
                <h4 className="text-sm font-medium text-slate-900">{meta.label}</h4>
                {onNew && (
                    <button
                        onClick={onNew}
                        className="text-xs text-blue-600 hover:text-blue-800"
                    >
                        Neu erfassen
                    </button>
                )}
            </div>

            {assessment ? (
                <div className="mt-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                            {assessment.total_score}
                        </span>
                        {meta.unit && (
                            <span className="text-sm text-slate-500">{meta.unit}</span>
                        )}
                    </div>
                    {risk && (
                        <span
                            className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${risk.bg} ${risk.text}`}
                        >
                            Risiko: {risk.label}
                        </span>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                        {formatDateTime(assessment.assessed_at)}
                    </p>
                </div>
            ) : (
                <p className="text-xs text-slate-500 mt-3">Noch nicht erfasst</p>
            )}
        </div>
    );
}

export function AssessmentOverview({ patientId, onNewAssessment }: AssessmentOverviewProps) {
    const { data: latest, isLoading, error } = useLatestAssessments(patientId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <p className="text-sm text-red-500 py-4 text-center">Fehler beim Laden der Assessments</p>;
    }

    const types = Object.keys(ASSESSMENT_META);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map((type) => (
                <AssessmentCard
                    key={type}
                    type={type}
                    assessment={latest?.[type]}
                    onNew={onNewAssessment ? () => onNewAssessment(type) : undefined}
                />
            ))}
        </div>
    );
}
