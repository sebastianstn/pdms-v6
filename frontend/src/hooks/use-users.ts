/**
 * Hooks für Benutzerverwaltung — CRUD-Operationen (nur Admin).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────

export interface AppUser {
    id: string;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    is_active: boolean;
    last_login: string | null;
    created_at: string | null;
}

export interface UserCreateInput {
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    password: string;
}

export interface UserUpdateInput {
    username?: string;
    email?: string;
    first_name?: string | null;
    last_name?: string | null;
    role?: string;
    is_active?: boolean;
}

export interface PasswordResetInput {
    new_password: string;
}

// ─── Query Keys ───────────────────────────────────────────────

const keys = {
    all: ["users"] as const,
    list: (filters?: Record<string, string>) => [...keys.all, "list", filters] as const,
    detail: (id: string) => [...keys.all, "detail", id] as const,
};

// ─── Read Hooks ───────────────────────────────────────────────

/** Listet alle Benutzer auf (nur Admin). */
export function useUsers(filters?: { role?: string; is_active?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.role) params.set("role", filters.role);
    if (filters?.is_active) params.set("is_active", filters.is_active);
    if (filters?.search) params.set("search", filters.search);
    params.set("limit", "200");

    const qs = params.toString();
    const path = `/users${qs ? `?${qs}` : ""}`;

    return useQuery<AppUser[]>({
        queryKey: keys.list(filters as Record<string, string>),
        queryFn: () => api.get<AppUser[]>(path),
    });
}

/** Einzelner Benutzer. */
export function useUser(userId: string) {
    return useQuery<AppUser>({
        queryKey: keys.detail(userId),
        queryFn: () => api.get<AppUser>(`/users/${userId}`),
        enabled: !!userId,
    });
}

// ─── Mutation Hooks ───────────────────────────────────────────

/** Neuen Benutzer erstellen. */
export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UserCreateInput) => api.post<AppUser>("/users", data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
}

/** Benutzer-Daten aktualisieren. */
export function useUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UserUpdateInput }) =>
            api.put<AppUser>(`/users/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
}

/** Passwort zurücksetzen. */
export function useResetPassword() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: PasswordResetInput }) =>
            api.put<{ status: string; message: string }>(`/users/${id}/password`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
}

/** Benutzer löschen. */
export function useDeleteUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/users/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
}
