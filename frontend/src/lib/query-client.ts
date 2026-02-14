/**
 * TanStack Query client configuration.
 */
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s
      gcTime: 5 * 60_000,       // 5min
      retry: (failureCount, error) => {
        // Auth/Client-Fehler nicht wiederholen -> schnellere UI-Reaktion
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Netz-/5xx-Fehler nur einmal wiederholen
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});
