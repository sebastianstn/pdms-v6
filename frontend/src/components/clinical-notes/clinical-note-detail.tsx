"use client";

import { Badge, Button } from "@/components/ui";
import {
    useFinalizeClinicalNote,
    useCoSignClinicalNote,
    useAmendClinicalNote,
    NOTE_TYPE_LABELS,
    NOTE_STATUS_LABELS,
    type ClinicalNote,
    type NoteStatus,
} from "@/hooks/use-clinical-notes";

// ─── Helpers ──────────────────────────────────────────────────

const statusVariant: Record<NoteStatus, "default" | "success" | "warning" | "danger" | "info"> = {
    draft: "default",
    final: "success",
    amended: "warning",
    entered_in_error: "danger",
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ─── Props ────────────────────────────────────────────────────

interface ClinicalNoteDetailProps {
    note: ClinicalNote;
    onEdit?: (note: ClinicalNote) => void;
    onClose?: () => void;
}

// ─── Component ────────────────────────────────────────────────

export function ClinicalNoteDetail({ note, onEdit, onClose }: ClinicalNoteDetailProps) {
    const finalizeMut = useFinalizeClinicalNote(note.id);
    const coSignMut = useCoSignClinicalNote(note.id);
    const amendMut = useAmendClinicalNote(note.id);

    return (
        <div className="border border-slate-200 rounded-lg bg-white">
            {/* Header */}
            <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant={statusVariant[note.status]}>
                                {NOTE_STATUS_LABELS[note.status]}
                            </Badge>
                            <span className="text-xs text-slate-400">
                                {NOTE_TYPE_LABELS[note.note_type]}
                            </span>
                            {note.is_confidential && (
                                <Badge variant="danger">🔒 Vertraulich</Badge>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">{note.title}</h3>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 text-lg"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                    <span>Erstellt: {formatDate(note.created_at)}</span>
                    {note.updated_at !== note.created_at && (
                        <span>Aktualisiert: {formatDate(note.updated_at)}</span>
                    )}
                    {note.co_signed_by && note.co_signed_at && (
                        <span className="text-green-600">
                            Co-signiert: {formatDate(note.co_signed_at)}
                        </span>
                    )}
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                        {note.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-block bg-slate-100 text-slate-500 rounded px-2 py-0.5 text-xs"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Summary */}
            {note.summary && (
                <div className="px-5 py-3 bg-blue-50/50 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-600">Zusammenfassung</p>
                    <p className="text-sm text-slate-700 mt-1">{note.summary}</p>
                </div>
            )}

            {/* Content */}
            <div className="px-5 py-4">
                <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap">
                    {note.content}
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 px-5 py-3 flex items-center gap-2">
                {(note.status === "draft" || note.status === "amended") && (
                    <>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onEdit?.(note)}
                        >
                            Bearbeiten
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => finalizeMut.mutate({})}
                            disabled={finalizeMut.isPending}
                        >
                            {finalizeMut.isPending ? "…" : "Finalisieren"}
                        </Button>
                    </>
                )}
                {note.status === "final" && !note.co_signed_by && (
                    <Button
                        size="sm"
                        onClick={() => coSignMut.mutate()}
                        disabled={coSignMut.isPending}
                    >
                        {coSignMut.isPending ? "…" : "Co-signieren"}
                    </Button>
                )}
                {note.status === "final" && (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => amendMut.mutate()}
                        disabled={amendMut.isPending}
                    >
                        Nachtrag
                    </Button>
                )}
            </div>
        </div>
    );
}
