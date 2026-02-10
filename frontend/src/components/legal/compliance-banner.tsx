"use client";

import { useConsents } from "@/hooks/use-consents";
import { useDirectives } from "@/hooks/use-directives";
import { CONSENT_TYPE_LABELS } from "@pdms/shared-types";

/** Required consents for a Home-Spital patient */
const REQUIRED_CONSENTS = [
    "home_spital",
    "iv_antibiotics",
    "ndsg",
] as const;

interface ComplianceBannerProps {
    patientId: string;
}

export function ComplianceBanner({ patientId }: ComplianceBannerProps) {
    const { data: consents } = useConsents(patientId);
    const { data: directives } = useDirectives(patientId);

    if (!consents) return null;

    const grantedTypes = new Set(
        consents
            .filter((c) => c.status === "granted")
            .map((c) => c.consent_type),
    );

    const missing = REQUIRED_CONSENTS.filter((t) => !grantedTypes.has(t));
    const hasDirective = directives && directives.length > 0;

    // All good — no banner
    if (missing.length === 0 && hasDirective) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
                <span className="text-amber-600 text-sm">⚠️</span>
                <span className="text-sm font-medium text-amber-800">
                    Compliance-Hinweis
                </span>
            </div>

            {missing.length > 0 && (
                <p className="text-xs text-amber-700">
                    Fehlende Einwilligungen:{" "}
                    {missing
                        .map((t) => CONSENT_TYPE_LABELS[t] ?? t)
                        .join(", ")}
                </p>
            )}

            {!hasDirective && (
                <p className="text-xs text-amber-700">
                    Keine Patientenverfügung / Vorsorgeauftrag hinterlegt.
                </p>
            )}
        </div>
    );
}
