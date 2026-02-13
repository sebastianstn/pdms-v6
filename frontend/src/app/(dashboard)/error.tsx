"use client";

/**
 * Next.js App Router Error Boundary — fängt Fehler in (dashboard)/ Routes.
 * Wird automatisch von Next.js als Error Boundary verwendet.
 */
export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex h-full items-center justify-center p-6">
            <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <svg
                        className="h-6 w-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                        />
                    </svg>
                </div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                    Seite konnte nicht geladen werden
                </h2>
                <p className="mb-4 text-sm text-slate-600">
                    Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen
                    Sie es erneut.
                </p>
                {process.env.NODE_ENV === "development" && (
                    <details className="mb-4 rounded-lg bg-red-50 p-3">
                        <summary className="cursor-pointer text-xs font-medium text-red-800">
                            Fehlerdetails
                        </summary>
                        <pre className="mt-2 overflow-auto text-xs text-red-700">
                            {error.message}
                        </pre>
                    </details>
                )}
                <div className="flex gap-3">
                    <button
                        onClick={reset}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                    >
                        Erneut versuchen
                    </button>
                    <button
                        onClick={() => (window.location.href = "/dashboard")}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Zum Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
