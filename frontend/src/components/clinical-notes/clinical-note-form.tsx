"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import {
    useCreateClinicalNote,
    useUpdateClinicalNote,
    NOTE_TYPE_LABELS,
    type ClinicalNote,
    type ClinicalNoteCreate,
    type NoteType,
} from "@/hooks/use-clinical-notes";

// ─── Props ────────────────────────────────────────────────────

interface ClinicalNoteFormProps {
    patientId: string;
    /** Wenn gesetzt → Edit-Modus */
    editNote?: ClinicalNote | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ─── Component ────────────────────────────────────────────────

export function ClinicalNoteForm({
    patientId,
    editNote,
    onSuccess,
    onCancel,
}: ClinicalNoteFormProps) {
    const isEdit = !!editNote;

    const createMut = useCreateClinicalNote();
    const updateMut = useUpdateClinicalNote(editNote?.id ?? "");

    const [noteType, setNoteType] = useState<NoteType>("progress_note");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [summary, setSummary] = useState("");
    const [tags, setTags] = useState("");
    const [isConfidential, setIsConfidential] = useState(false);

    // Prefill in edit mode
    useEffect(() => {
        if (editNote) {
            setNoteType(editNote.note_type);
            setTitle(editNote.title);
            setContent(editNote.content);
            setSummary(editNote.summary ?? "");
            setTags(editNote.tags?.join(", ") ?? "");
            setIsConfidential(editNote.is_confidential);
        }
    }, [editNote]);

    const isPending = createMut.isPending || updateMut.isPending;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsedTags = tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        if (isEdit && editNote) {
            updateMut.mutate(
                {
                    title,
                    content,
                    summary: summary || undefined,
                    note_type: noteType,
                    is_confidential: isConfidential,
                    tags: parsedTags.length > 0 ? parsedTags : undefined,
                },
                { onSuccess },
            );
        } else {
            const data: ClinicalNoteCreate = {
                patient_id: patientId,
                note_type: noteType,
                title,
                content,
                summary: summary || undefined,
                is_confidential: isConfidential,
                tags: parsedTags.length > 0 ? parsedTags : undefined,
            };
            createMut.mutate(data, { onSuccess });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h3 className="font-medium text-slate-800">
                {isEdit ? "Notiz bearbeiten" : "Neue klinische Notiz"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Typ */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                        Typ *
                    </label>
                    <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value as NoteType)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        required
                    >
                        {Object.entries(NOTE_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Titel */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                        Titel *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="z.B. Verlauf 14.02 — Kardiologisches Konsil"
                        required
                        maxLength={255}
                    />
                </div>
            </div>

            {/* Inhalt */}
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                    Inhalt *
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[180px] font-mono"
                    placeholder="Markdown-fähig: Verwenden Sie **fett**, *kursiv*, Listen etc."
                    required
                />
            </div>

            {/* Zusammenfassung */}
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                    Zusammenfassung <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[60px]"
                    placeholder="Kurze Zusammenfassung für die Übersicht"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                        Tags <span className="text-slate-400">(kommagetrennt)</span>
                    </label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="z.B. kardiologie, akut, nachtverlauf"
                    />
                </div>

                {/* Vertraulich */}
                <div className="flex items-center gap-2 pt-6">
                    <input
                        type="checkbox"
                        id="confidential"
                        checked={isConfidential}
                        onChange={(e) => setIsConfidential(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                    />
                    <label htmlFor="confidential" className="text-sm text-slate-600">
                        Vertraulich (eingeschränkter Zugriff)
                    </label>
                </div>
            </div>

            {/* Error */}
            {(createMut.isError || updateMut.isError) && (
                <p className="text-sm text-red-600">
                    Fehler: {(createMut.error ?? updateMut.error)?.message ?? "Unbekannter Fehler"}
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={isPending || !title.trim() || !content.trim()}>
                    {isPending
                        ? "Speichern…"
                        : isEdit
                            ? "Änderungen speichern"
                            : "Notiz erstellen"}
                </Button>
                {onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Abbrechen
                    </Button>
                )}
            </div>
        </form>
    );
}
