"use client";

/**
 * Next.js Global Error Boundary — fängt Fehler in Root-Layout.
 * Letzte Verteidigungslinie gegen weisse Bildschirme.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="de">
            <body>
                <div
                    style={{
                        display: "flex",
                        minHeight: "100vh",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f8fafc",
                        padding: "1.5rem",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "28rem",
                            borderRadius: "0.75rem",
                            border: "1px solid #fecaca",
                            backgroundColor: "white",
                            padding: "2rem",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "1.25rem",
                                fontWeight: 600,
                                color: "#0f172a",
                                marginBottom: "0.5rem",
                            }}
                        >
                            Kritischer Fehler
                        </h2>
                        <p
                            style={{
                                fontSize: "0.875rem",
                                color: "#475569",
                                marginBottom: "1rem",
                            }}
                        >
                            Die PDMS-Anwendung hat einen kritischen Fehler festgestellt. Bitte
                            laden Sie die Seite neu.
                        </p>
                        {error?.message && (
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#94a3b8",
                                    marginBottom: "1rem",
                                    fontFamily: "monospace",
                                    wordBreak: "break-word",
                                }}
                            >
                                {error.message}
                            </p>
                        )}
                        <button
                            onClick={reset}
                            style={{
                                borderRadius: "0.5rem",
                                backgroundColor: "#0284c7",
                                padding: "0.5rem 1rem",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Seite neu laden
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
