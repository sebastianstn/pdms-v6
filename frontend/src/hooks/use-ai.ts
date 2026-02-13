/**
 * useAI – React Hook für den PDMS AI Orchestrator
 *
 * Verwendung:
 *   const { ask, isLoading, error, sessions } = useAI();
 *   const result = await ask("Erkläre die Vitalzeichen von Patient 42");
 */

import { useState, useCallback, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────
export type AIProvider =
    | "auto"
    | "gemini"
    | "claude"
    | "deepseek"
    | "biogpt"
    | "ensemble";

export interface AIResponse {
    status: string;
    result: string;
    agents_used: string[];
    provider: string;
    validation: string | null;
    session_id: string | null;
    duration_ms: number;
}

export interface AISession {
    id: string;
    message_count: number;
    created_at: number;
    last_active: number;
}

interface UseAIOptions {
    /** LLM-Provider (default: "auto") */
    provider?: AIProvider;
    /** Session-ID für Konversations-Memory */
    sessionId?: string;
    /** Claude-Validierung aktivieren */
    validateWithClaude?: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────
export function useAI(options: UseAIOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
    const sessionIdRef = useRef<string | null>(options.sessionId ?? null);

    /**
     * Stellt eine Frage an den AI-Orchestrator.
     */
    const ask = useCallback(
        async (task: string): Promise<AIResponse> => {
            setIsLoading(true);
            setError(null);

            try {
                const res = await fetch("/ai/ask", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        task,
                        provider: options.provider ?? "auto",
                        session_id: sessionIdRef.current,
                        validate_with_claude: options.validateWithClaude ?? false,
                    }),
                });

                if (!res.ok) {
                    const detail = await res.json().catch(() => ({}));
                    throw new Error(detail.detail || `HTTP ${res.status}`);
                }

                const data: AIResponse = await res.json();

                // Session-ID für Folge-Anfragen merken
                if (data.session_id) {
                    sessionIdRef.current = data.session_id;
                }

                setLastResponse(data);
                return data;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
                setError(msg);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [options.provider, options.validateWithClaude]
    );

    /**
     * Erstellt eine neue Konversations-Session.
     */
    const createSession = useCallback(async (): Promise<string> => {
        const res = await fetch("/ai/sessions", { method: "POST" });
        const data = await res.json();
        sessionIdRef.current = data.session_id;
        return data.session_id;
    }, []);

    /**
     * Listet alle aktiven Sessions auf.
     */
    const listSessions = useCallback(async (): Promise<AISession[]> => {
        const res = await fetch("/ai/sessions");
        return res.json();
    }, []);

    /**
     * Löscht die aktuelle Session.
     */
    const clearSession = useCallback(async () => {
        if (sessionIdRef.current) {
            await fetch(`/ai/sessions/${sessionIdRef.current}`, { method: "DELETE" });
            sessionIdRef.current = null;
        }
    }, []);

    return {
        ask,
        isLoading,
        error,
        lastResponse,
        sessionId: sessionIdRef.current,
        createSession,
        listSessions,
        clearSession,
    };
}
