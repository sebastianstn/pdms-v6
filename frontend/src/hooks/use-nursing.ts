/**
 * Nursing hooks — entries + assessments.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Types ────────────────────────────────────────────────────

export type EntryCategory =
    | "observation"
    | "intervention"
    | "assessment"
    | "handover"
    | "wound_care"
    | "mobility"
    | "nutrition"
    | "elimination"
    | "communication";

export type EntryPriority = "low" | "normal" | "high" | "urgent";

export interface NursingEntry {
    id: string;
    patient_id: string;
    encounter_id?: string;
    category: EntryCategory;
    title: string;
    content: string;
    priority: EntryPriority;
    recorded_at: string;
    recorded_by?: string;
    is_handover: boolean;
    created_at: string;
    updated_at: string;
}

export interface NursingEntryCreate {
    patient_id: string;
    encounter_id?: string;
    category: EntryCategory;
    title: string;
    content: string;
    priority?: EntryPriority;
    is_handover?: boolean;
}

export interface NursingEntryUpdate {
    title?: string;
    content?: string;
    priority?: EntryPriority;
    category?: EntryCategory;
    is_handover?: boolean;
}

interface PaginatedNursingEntries {
    items: NursingEntry[];
    total: number;
    page: number;
    per_page: number;
}

// ─── Assessment Types ─────────────────────────────────────────

export type AssessmentType = "barthel" | "norton" | "braden" | "pain" | "fall_risk" | "nutrition";
export type RiskLevel = "low" | "medium" | "high" | "very_high";

export interface NursingAssessment {
    id: string;
    patient_id: string;
    encounter_id?: string;
    assessment_type: AssessmentType;
    total_score: number;
    max_score?: number;
    risk_level?: RiskLevel;
    items: Record<string, number>;
    notes?: string;
    assessed_at: string;
    assessed_by?: string;
    created_at: string;
}

export interface AssessmentCreate {
    patient_id: string;
    encounter_id?: string;
    assessment_type: AssessmentType;
    total_score: number;
    max_score?: number;
    risk_level?: RiskLevel;
    items: Record<string, number>;
    notes?: string;
}

interface PaginatedAssessments {
    items: NursingAssessment[];
    total: number;
    page: number;
    per_page: number;
}

export interface AssessmentItemDef {
    label: string;
    options: number[];
}

export interface AssessmentDefinition {
    name: string;
    max_score: number;
    items: Record<string, AssessmentItemDef>;
    risk_levels: Array<{ max: number; level: string; label: string }>;
}

// ─── Nursing Entry Hooks ──────────────────────────────────────

export function useNursingEntries(
    patientId: string,
    opts?: { category?: string; handoverOnly?: boolean },
) {
    const params = new URLSearchParams();
    if (opts?.category) params.set("category", opts.category);
    if (opts?.handoverOnly) params.set("handover_only", "true");

    return useQuery<PaginatedNursingEntries>({
        queryKey: ["nursing-entries", patientId, opts?.category, opts?.handoverOnly],
        queryFn: () => api.get(`/patients/${patientId}/nursing-entries?${params.toString()}`),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useNursingEntry(entryId: string) {
    return useQuery<NursingEntry>({
        queryKey: ["nursing-entry", entryId],
        queryFn: () => api.get(`/nursing-entries/${entryId}`),
        enabled: !!entryId,
    });
}

export function useCreateNursingEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: NursingEntryCreate) =>
            api.post<NursingEntry>("/nursing-entries", data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ["nursing-entries", variables.patient_id] });
        },
    });
}

export function useUpdateNursingEntry(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: NursingEntryUpdate }) =>
            api.patch<NursingEntry>(`/nursing-entries/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["nursing-entries", patientId] });
        },
    });
}

export function useDeleteNursingEntry(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (entryId: string) => api.delete(`/nursing-entries/${entryId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["nursing-entries", patientId] });
        },
    });
}

// ─── Assessment Hooks ─────────────────────────────────────────

export function useAssessmentDefinitions() {
    return useQuery<Record<string, AssessmentDefinition>>({
        queryKey: ["assessment-definitions"],
        queryFn: () => api.get("/assessments/definitions"),
        staleTime: 1000 * 60 * 60, // 1h — definitions rarely change
    });
}

export function useAssessments(patientId: string, assessmentType?: string) {
    const params = new URLSearchParams();
    if (assessmentType) params.set("assessment_type", assessmentType);

    return useQuery<PaginatedAssessments>({
        queryKey: ["assessments", patientId, assessmentType],
        queryFn: () => api.get(`/patients/${patientId}/assessments?${params.toString()}`),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useLatestAssessments(patientId: string) {
    return useQuery<Record<string, NursingAssessment>>({
        queryKey: ["assessments-latest", patientId],
        queryFn: () => api.get(`/patients/${patientId}/assessments/latest`),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useCreateAssessment(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: AssessmentCreate) =>
            api.post<NursingAssessment>("/assessments", data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["assessments", patientId] });
            qc.invalidateQueries({ queryKey: ["assessments-latest", patientId] });
        },
    });
}
