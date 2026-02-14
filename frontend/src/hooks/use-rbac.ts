/**
 * Hooks für RBAC-Permissions (Zugriffsberechtigungen).
 * - useRbacMatrix: Vollständige Matrix für Admin-Verwaltung
 * - useUpdateRbacPermission: Einzelne Berechtigung ändern (Admin)
 * - useUserPermissions: Effektive Berechtigungen des aktuellen Users
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCallback } from "react";

export interface RbacMatrixRow {
    resource: string;
    arzt: string;
    pflege: string;
    fage: string;
    admin: string;
}

export interface RbacMatrixResponse {
    roles: string[];
    resources: string[];
    matrix: RbacMatrixRow[];
}

export interface RbacPermissionUpdate {
    role: string;
    resource: string;
    access: string;
}

/** Lädt die vollständige RBAC-Matrix. */
export function useRbacMatrix() {
    return useQuery({
        queryKey: ["rbac-matrix"],
        queryFn: () => api.get<RbacMatrixResponse>("/rbac/matrix"),
    });
}

/** Aktualisiert eine einzelne Berechtigung (nur Admin). */
export function useUpdateRbacPermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: RbacPermissionUpdate) =>
            api.put<{ status: string }>("/rbac/permission", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rbac-matrix"] });
            queryClient.invalidateQueries({ queryKey: ["rbac-user-permissions"] });
        },
    });
}

/* ─── User-Permissions (effektive Berechtigungen) ──────────────── */

export interface UserPermissionsResponse {
    username: string;
    roles: string[];
    permissions: Record<string, string>;
}

/**
 * Lädt die effektiven Berechtigungen des aktuellen Users.
 * Gibt Hilfsfunktionen canRead() und canWrite() zurück.
 */
export function useUserPermissions() {
    const query = useQuery({
        queryKey: ["rbac-user-permissions"],
        queryFn: () => api.get<UserPermissionsResponse>("/rbac/user-permissions"),
        staleTime: 30_000, // 30s Cache
        refetchOnWindowFocus: true,
    });

    const permissions = query.data?.permissions ?? {};

    /** Prüft ob der User Lesezugriff auf eine Ressource hat. */
    const canRead = useCallback(
        (resource: string): boolean => {
            const access = permissions[resource];
            return access === "R" || access === "RW";
        },
        [permissions],
    );

    /** Prüft ob der User Schreibzugriff auf eine Ressource hat. */
    const canWrite = useCallback(
        (resource: string): boolean => {
            const access = permissions[resource];
            return access === "RW";
        },
        [permissions],
    );

    return {
        ...query,
        permissions,
        canRead,
        canWrite,
    };
}
