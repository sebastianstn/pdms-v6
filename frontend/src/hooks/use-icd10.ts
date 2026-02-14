/**
 * ICD-10 Katalog hooks — Suchfunktion für Diagnose-Autovervollständigung.
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Icd10Result {
    code: string;
    title: string;
    chapter: string | null;
    category: string | null;
}

interface Icd10SearchResponse {
    results: Icd10Result[];
    query: string;
}

/**
 * Sucht im ICD-10 Katalog nach Code oder Bezeichnung.
 * Wird erst ab 2 Zeichen aktiv (debounced im Aufrufer).
 */
export function useIcd10Search(query: string, enabled = true) {
    return useQuery<Icd10SearchResponse>({
        queryKey: ["icd10", "search", query],
        queryFn: () =>
            api.get<Icd10SearchResponse>(`/icd10/search?q=${encodeURIComponent(query)}&limit=10`),
        enabled: enabled && query.length >= 2,
        staleTime: 60_000, // 1 Min cache — Katalog ändert sich selten
        placeholderData: (prev) => prev,
    });
}
