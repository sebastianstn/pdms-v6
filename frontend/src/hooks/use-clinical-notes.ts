/**
 * Clinical Notes hooks — CRUD, finalize, co-sign, amend.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Types ────────────────────────────────────────────────────

export type NoteType =
    | "progress_note"
    | "admission_note"
    | "discharge_summary"
    | "consultation"
    | "procedure_note"
    | "handoff";

export type NoteStatus = "draft" | "final" | "amended" | "entered_in_error";

export interface ClinicalNote {
    id: string;
    patient_id: string;
    encounter_id?: string;
    note_type: NoteType;
    title: string;
    content: string;
    summary?: string;
    author_id?: string;
    co_signed_by?: string;
    co_signed_at?: string;
    status: NoteStatus;
    is_confidential: boolean;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface ClinicalNoteCreate {
    patient_id: string;
    encounter_id?: string;
    note_type: NoteType;
    title: string;
    content: string;
    summary?: string;
    is_confidential?: boolean;
    tags?: string[];
}

export interface ClinicalNoteUpdate {
    title?: string;
    content?: string;
    summary?: string;
    note_type?: NoteType;
    status?: NoteStatus;
    is_confidential?: boolean;
    tags?: string[];
}

interface PaginatedClinicalNotes {
    items: ClinicalNote[];
    total: number;
    page: number;
    per_page: number;
}

interface NoteMeta {
    note_types: Record<string, string>;
    note_statuses: Record<string, string>;
}

// ─── Labels (offline fallback) ────────────────────────────────

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
    progress_note: "Verlaufsnotiz",
    admission_note: "Aufnahmebericht",
    discharge_summary: "Entlassbericht",
    consultation: "Konsilbericht",
    procedure_note: "Interventionsbericht",
    handoff: "Dienstübergabe",
};

export const NOTE_STATUS_LABELS: Record<NoteStatus, string> = {
    draft: "Entwurf",
    final: "Finalisiert",
    amended: "Nachtrag",
    entered_in_error: "Fehleingabe",
};

// ─── Query Keys ───────────────────────────────────────────────

const keys = {
    all: ["clinical-notes"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    detail: (noteId: string) => [...keys.all, "detail", noteId] as const,
    meta: () => [...keys.all, "meta"] as const,
};

// ─── Read Hooks ───────────────────────────────────────────────

export function useClinicalNotes(
    patientId: string,
    params?: { note_type?: NoteType; status?: NoteStatus; page?: number; per_page?: number },
) {
    const search = new URLSearchParams();
    if (params?.note_type) search.set("note_type", params.note_type);
    if (params?.status) search.set("status", params.status);
    if (params?.page) search.set("page", String(params.page));
    if (params?.per_page) search.set("per_page", String(params.per_page));
    const qs = search.toString();

    return useQuery<PaginatedClinicalNotes>({
        queryKey: [...keys.list(patientId), params],
        queryFn: () =>
            api.get<PaginatedClinicalNotes>(
                `/patients/${patientId}/clinical-notes${qs ? `?${qs}` : ""}`,
            ),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useClinicalNote(noteId: string) {
    return useQuery<ClinicalNote>({
        queryKey: keys.detail(noteId),
        queryFn: () => api.get<ClinicalNote>(`/clinical-notes/${noteId}`),
        enabled: !!noteId,
    });
}

export function useNoteMeta() {
    return useQuery<NoteMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<NoteMeta>("/clinical-notes/meta"),
        staleTime: Infinity,
    });
}

// ─── Mutation Hooks ───────────────────────────────────────────

export function useCreateClinicalNote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ClinicalNoteCreate) =>
            api.post<ClinicalNote>("/clinical-notes", data),
        onSuccess: (note) => {
            qc.invalidateQueries({ queryKey: keys.list(note.patient_id) });
        },
    });
}

export function useUpdateClinicalNote(noteId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ClinicalNoteUpdate) =>
            api.patch<ClinicalNote>(`/clinical-notes/${noteId}`, data),
        onSuccess: (note) => {
            qc.invalidateQueries({ queryKey: keys.list(note.patient_id) });
            qc.setQueryData(keys.detail(noteId), note);
        },
    });
}

export function useFinalizeClinicalNote(noteId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body?: { summary?: string }) =>
            api.post<ClinicalNote>(`/clinical-notes/${noteId}/finalize`, body ?? {}),
        onSuccess: (note) => {
            qc.invalidateQueries({ queryKey: keys.list(note.patient_id) });
            qc.setQueryData(keys.detail(noteId), note);
        },
    });
}

export function useCoSignClinicalNote(noteId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () =>
            api.post<ClinicalNote>(`/clinical-notes/${noteId}/co-sign`, {}),
        onSuccess: (note) => {
            qc.invalidateQueries({ queryKey: keys.list(note.patient_id) });
            qc.setQueryData(keys.detail(noteId), note);
        },
    });
}

export function useAmendClinicalNote(noteId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () =>
            api.post<ClinicalNote>(`/clinical-notes/${noteId}/amend`, {}),
        onSuccess: (note) => {
            qc.invalidateQueries({ queryKey: keys.list(note.patient_id) });
            qc.setQueryData(keys.detail(noteId), note);
        },
    });
}

export function useDeleteClinicalNote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (params: { noteId: string; patientId: string }) =>
            api.delete(`/clinical-notes/${params.noteId}`),
        onSuccess: (_res, params) => {
            qc.invalidateQueries({ queryKey: keys.list(params.patientId) });
        },
    });
}
