"use client";

/**
 * MedicalLetterList — Arztbriefe mit Status-Workflow.
 */
import { useMedicalLetters } from "@/hooks/use-medical-letters";
import { Spinner } from "@/components/ui";
import {
  LETTER_TYPE_LABELS,
  LETTER_STATUS_LABELS,
  type MedicalLetterStatus,
  type MedicalLetterType,
} from "@pdms/shared-types";

interface Props {
  patientId: string;
  onEdit?: (letterId: string) => void;
  onView?: (letterId: string) => void;
}

function statusColor(s: MedicalLetterStatus): string {
  switch (s) {
    case "draft": return "bg-amber-100 text-amber-800";
    case "final": return "bg-blue-100 text-blue-800";
    case "sent": return "bg-emerald-100 text-emerald-800";
  }
}

function typeIcon(t: MedicalLetterType): string {
  switch (t) {
    case "discharge": return "E";
    case "referral": return "Z";
    case "progress": return "V";
    case "transfer": return "T";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

export function MedicalLetterList({ patientId, onEdit, onView }: Props) {
  const { data, isLoading, isError } = useMedicalLetters(patientId);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner size="sm" /></div>;
  if (isError) return <p className="text-sm text-red-600 text-center py-4">Arztbriefe konnten nicht geladen werden.</p>;

  const items = data?.items ?? [];
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-4">Keine Arztbriefe vorhanden.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((letter) => (
        <div
          key={letter.id}
          className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors cursor-pointer"
          onClick={() => onView?.(letter.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span>{typeIcon(letter.letter_type)}</span>
              <div>
                <h4 className="font-medium text-slate-900">{letter.title}</h4>
                <span className="text-xs text-slate-500">
                  {LETTER_TYPE_LABELS[letter.letter_type]} · {formatDate(letter.created_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(letter.status)}`}>
                {LETTER_STATUS_LABELS[letter.status]}
              </span>
              {letter.co_signed_by && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Visiert
                </span>
              )}
            </div>
          </div>
          {letter.diagnosis && (
            <p className="text-sm text-slate-600 mt-2">{letter.diagnosis}</p>
          )}
          {letter.sent_to && (
            <p className="text-xs text-emerald-600 mt-1">Gesendet an: {letter.sent_to}</p>
          )}
          {onEdit && letter.status === "draft" && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(letter.id); }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Bearbeiten
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
