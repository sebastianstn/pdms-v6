"use client";

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

/**
 * Global Error Boundary — fängt unbehandelte React-Fehler ab und zeigt
 * eine benutzerfreundliche Fehlermeldung statt eines weissen Bildschirms.
 */
export function ErrorBoundary({ children }: ErrorBoundaryProps) {
    return <ErrorBoundaryInner>{children}</ErrorBoundaryInner>;
}

// React Error Boundaries müssen Class-Komponenten sein
class ErrorBoundaryInner extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[PDMS Error Boundary]", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorFallback
                    error={this.state.error}
                    onReset={() => this.setState({ hasError: false, error: null })}
                />
            );
        }
        return this.props.children;
    }
}

// Wegen "use client" brauchen wir den React-Import hier explizit
import React from "react";

function ErrorFallback({
    error,
    onReset,
}: {
    error: Error | null;
    onReset: () => void;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
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
                    Ein Fehler ist aufgetreten
                </h2>
                <p className="mb-4 text-sm text-slate-600">
                    Die Anwendung hat einen unerwarteten Fehler festgestellt. Bitte
                    versuchen Sie es erneut oder kontaktieren Sie den Support.
                </p>
                {error && process.env.NODE_ENV === "development" && (
                    <details className="mb-4 rounded-lg bg-red-50 p-3">
                        <summary className="cursor-pointer text-xs font-medium text-red-800">
                            Technische Details
                        </summary>
                        <pre className="mt-2 overflow-auto text-xs text-red-700">
                            {error.message}
                            {"\n"}
                            {error.stack}
                        </pre>
                    </details>
                )}
                <div className="flex gap-3">
                    <button
                        onClick={onReset}
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
