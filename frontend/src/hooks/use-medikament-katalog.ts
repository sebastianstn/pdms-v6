/**
 * Medikamenten-Katalog hooks — Suchfunktion für Autovervollständigung.
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface MedikamentResult {
    name: string;
    wirkstoff: string;
    hersteller: string | null;
    dosis: string | null;
    form: string | null;
    route: string | null;
    route_label: string | null;
    atc_code: string | null;
    kategorie: string | null;
}

interface MedikamentSearchResponse {
    results: MedikamentResult[];
    query: string;
}

/**
 * Sucht im Medikamenten-Katalog nach Name, Wirkstoff oder ATC-Code.
 * Wird erst ab 2 Zeichen aktiv (debounced im Aufrufer).
 */
export function useMedikamentSearch(query: string, enabled = true) {
    return useQuery<MedikamentSearchResponse>({
        queryKey: ["medikament-katalog", "search", query],
        queryFn: () =>
            api.get<MedikamentSearchResponse>(
                `/medikamente-katalog/search?q=${encodeURIComponent(query)}&limit=12`,
            ),
        enabled: enabled && query.length >= 2,
        staleTime: 60_000,
        placeholderData: (prev) => prev,
    });
}
