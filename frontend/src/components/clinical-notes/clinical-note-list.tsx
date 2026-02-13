"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { Spinner } from "@/components/ui";
import {
    useClinicalNotes,
    useDeleteClinicalNote,
    useFinalizeClinicalNote,
    useCoSignClinicalNote,
    useAmendClinicalNote,
    NOTE_TYPE_LABELS,
    NOTE_STATUS_LABELS,
    type ClinicalNote,
    type NoteType,
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

interface ClinicalNoteListProps {
    patientId: string;
    onEdit?: (note: ClinicalNote) => void;
    onView?: (note: ClinicalNote) => void;
}

// ─── Component ────────────────────────────────────────────────

export function ClinicalNoteList({ patientId, onEdit, onView }: ClinicalNoteListProps) {
    const [filterType, setFilterType] = useState<NoteType | "">("");
    const [filterStatus, setFilterStatus] = useState<NoteStatus | "">("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useClinicalNotes(patientId, {
        note_type: filterType || undefined,
        status: filterStatus || undefined,
        page,
        per_page: 20,
    });

    const deleteMut = useDeleteClinicalNote();

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    const notes = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 20);

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value as NoteType | ""); setPage(1); }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
                >
                    <option value="">Alle Typen</option>
                    {Object.entries(NOTE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value as NoteStatus | ""); setPage(1); }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
                >
                    <option value="">Alle Status</option>
                    {Object.entries(NOTE_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>

                <span className="text-xs text-slate-400 self-center ml-auto">
                    {total} Notiz{total !== 1 ? "en" : ""}
                </span>
            </div>

            {/* Note Cards */}
            {notes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                    Keine klinischen Notizen vorhanden.
                </p>
            ) : (
                <div className="space-y-3">
                    {notes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            patientId={patientId}
                            onEdit={onEdit}
                            onView={onView}
                            onDelete={() =>
                                deleteMut.mutate({ noteId: note.id, patientId })
                            }
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1 text-sm rounded border border-slate-200 disabled:opacity-40"
                    >
                        ← Zurück
                    </button>
                    <span className="text-sm text-slate-500">
                        Seite {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="px-3 py-1 text-sm rounded border border-slate-200 disabled:opacity-40"
                    >
                        Weiter →
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Single Note Card ─────────────────────────────────────────

interface NoteCardProps {
    note: ClinicalNote;
    patientId: string;
    onEdit?: (note: ClinicalNote) => void;
    onView?: (note: ClinicalNote) => void;
    onDelete?: () => void;
}

function NoteCard({ note, patientId, onEdit, onView, onDelete }: NoteCardProps) {
    const finalizeMut = useFinalizeClinicalNote(note.id);
    const coSignMut = useCoSignClinicalNote(note.id);
    const amendMut = useAmendClinicalNote(note.id);

    return (
        <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusVariant[note.status]}>
                            {NOTE_STATUS_LABELS[note.status]}
                        </Badge>
                        <span className="text-xs text-slate-400">
                            {NOTE_TYPE_LABELS[note.note_type]}
                        </span>
                        {note.is_confidential && (
                            <Badge variant="danger">Vertraulich</Badge>
                        )}
                        {note.co_signed_by && (
                            <Badge variant="success">Co-signiert</Badge>
                        )}
                    </div>
                    <h4
                        className="font-medium text-slate-800 truncate cursor-pointer hover:text-blue-600"
                        onClick={() => onView?.(note)}
                    >
                        {note.title}
                    </h4>
                    {note.summary && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {note.summary}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>{formatDate(note.created_at)}</span>
                        {note.tags && note.tags.length > 0 && (
                            <span>
                                {note.tags.map((t) => (
                                    <span key={t} className="inline-block bg-slate-100 rounded px-1.5 py-0.5 mr-1">
                                        {t}
                                    </span>
                                ))}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {note.status === "draft" && (
                        <>
                            <button
                                onClick={() => onEdit?.(note)}
                                className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                            >
                                Bearbeiten
                            </button>
                            <button
                                onClick={() => finalizeMut.mutate({})}
                                disabled={finalizeMut.isPending}
                                className="px-2 py-1 text-xs rounded bg-green-50 hover:bg-green-100 text-green-700"
                            >
                                Finalisieren
                            </button>
                        </>
                    )}
                    {note.status === "final" && !note.co_signed_by && (
                        <button
                            onClick={() => coSignMut.mutate()}
                            disabled={coSignMut.isPending}
                            className="px-2 py-1 text-xs rounded bg-blue-50 hover:bg-blue-100 text-blue-700"
                        >
                            Co-signieren
                        </button>
                    )}
                    {note.status === "final" && (
                        <button
                            onClick={() => amendMut.mutate()}
                            disabled={amendMut.isPending}
                            className="px-2 py-1 text-xs rounded bg-amber-50 hover:bg-amber-100 text-amber-700"
                        >
                            Nachtrag
                        </button>
                    )}
                    {note.status === "amended" && (
                        <button
                            onClick={() => onEdit?.(note)}
                            className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                            Bearbeiten
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        className="px-2 py-1 text-xs rounded bg-red-50 hover:bg-red-100 text-red-700"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
}
