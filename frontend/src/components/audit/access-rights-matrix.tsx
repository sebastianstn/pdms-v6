"use client";

/**
 * AccessRightsMatrix — Interaktive RBAC-Zugriffs-Matrix.
 * Admins können Berechtigungen per Klick ändern (R → RW → — → R).
 * Alle anderen Rollen sehen die Matrix nur lesend.
 */

import { useState, useCallback } from "react";
import { Badge, Spinner } from "@/components/ui";
import {
    useRbacMatrix,
    useUpdateRbacPermission,
    type RbacMatrixRow,
} from "@/hooks/use-rbac";

// Reihenfolge der Zugriffsrechte beim Klicken
const ACCESS_CYCLE: string[] = ["R", "RW", "—"];

function nextAccess(current: string): string {
    const idx = ACCESS_CYCLE.indexOf(current);
    return ACCESS_CYCLE[(idx + 1) % ACCESS_CYCLE.length];
}

// Rollen-Labels für Spaltenüberschriften
const ROLE_LABELS: Record<string, string> = {
    arzt: "Arzt",
    pflege: "Pflege",
    fage: "FaGe",
    admin: "Admin",
};

type MatrixRoleKey = Exclude<keyof RbacMatrixRow, "resource">;

function getAccessForRole(row: RbacMatrixRow, role: string): string {
    if (role === "arzt" || role === "pflege" || role === "fage" || role === "admin") {
        return row[role as MatrixRoleKey] ?? "—";
    }
    return "—";
}

// Badge pro Zugriffslevel
function AccessBadge({
    access,
    onClick,
    isEditable,
    isPending,
}: {
    access: string;
    onClick?: () => void;
    isEditable: boolean;
    isPending?: boolean;
}) {
    const badge = (() => {
        if (access === "RW") return <Badge variant="success">Lesen/Schreiben</Badge>;
        if (access === "R") return <Badge variant="info">Nur Lesen</Badge>;
        return <Badge variant="default">Kein Zugriff</Badge>;
    })();

    if (!isEditable) return badge;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isPending}
            className="group relative cursor-pointer disabled:opacity-50 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 rounded"
            title="Klicken zum Ändern"
        >
            {badge}
            {isPending && (
                <span className="absolute -top-1 -right-1 w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
        </button>
    );
}

interface AccessRightsMatrixProps {
    /** Ob der Benutzer Admin-Rechte hat (→ bearbeiten darf). */
    isAdmin?: boolean;
}

export function AccessRightsMatrix({ isAdmin = true }: AccessRightsMatrixProps) {
    const { data, isLoading, error } = useRbacMatrix();
    const updateMut = useUpdateRbacPermission();

    // Tracking welche Zelle gerade aktualisiert wird
    const [pendingKey, setPendingKey] = useState<string | null>(null);

    const handleToggle = useCallback(
        (resource: string, role: string, currentAccess: string) => {
            const newAccess = nextAccess(currentAccess);
            const key = `${role}:${resource}`;
            setPendingKey(key);
            updateMut.mutate(
                { role, resource, access: newAccess },
                { onSettled: () => setPendingKey(null) },
            );
        },
        [updateMut],
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
            </div>
        );
    }

    if (error) {
        return (
            <p className="text-sm text-red-500 py-4">
                Fehler beim Laden der Berechtigungen: {error.message}
            </p>
        );
    }

    const matrix = data?.matrix ?? [];
    const roles = data?.roles ?? ["arzt", "pflege", "fage", "admin"];

    return (
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Übersicht der Zugriffsberechtigungen nach Rolle gemäss IEC 62304 und nDSG.
                {isAdmin && (
                    <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">
                        Klicken Sie auf ein Badge, um die Berechtigung zu ändern.
                    </span>
                )}
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 uppercase">
                        <tr>
                            <th className="px-3 py-2.5 font-semibold">Ressource</th>
                            {roles.map((role) => (
                                <th key={role} className="px-3 py-2.5 text-center font-semibold">
                                    {ROLE_LABELS[role] ?? role}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row: RbacMatrixRow) => (
                            <tr
                                key={row.resource}
                                className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                                    {row.resource}
                                </td>
                                {roles.map((role) => {
                                    const access = getAccessForRole(row, role);
                                    const key = `${role}:${row.resource}`;
                                    return (
                                        <td key={role} className="px-3 py-2.5 text-center">
                                            <AccessBadge
                                                access={access}
                                                isEditable={isAdmin ?? false}
                                                isPending={pendingKey === key}
                                                onClick={
                                                    isAdmin
                                                        ? () => handleToggle(row.resource, role, access)
                                                        : undefined
                                                }
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legende */}
            <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                    <Badge variant="success">Lesen/Schreiben</Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Vollzugriff</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="info">Nur Lesen</Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Lesezugriff</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="default">Kein Zugriff</Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Gesperrt</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                    IEC 62304 konform · nDSG Art. 5c
                </p>
            </div>
        </div>
    );
}
