"use client";

import { useState } from "react";
import { usePatients } from "@/hooks/use-patients";
import Link from "next/link";
import { PatientCard } from "@/components/patients/patient-card";

export default function PatientsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = usePatients(page, search || undefined);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Patienten</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {data ? `${data.total} Patienten` : "Wird geladen..."}
                    </p>
                </div>
                <Link
                    href="/patients/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    + Neuer Patient
                </Link>
            </div>

            {/* Suchfeld */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Patient suchen (Name, AHV-Nr.)..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="w-full max-w-md px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
            </div>

            {/* Fehler */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm">
                    Fehler beim Laden: {error.message}
                </div>
            )}

            {/* Laden */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            )}

            {/* Patientenliste */}
            {data && (
                <>
                    {data.items.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                            <p className="text-slate-400">Keine Patienten gefunden</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.items.map((patient) => (
                                <PatientCard
                                    key={patient.id}
                                    id={patient.id}
                                    firstName={patient.first_name}
                                    lastName={patient.last_name}
                                    dateOfBirth={patient.date_of_birth}
                                    gender={patient.gender}
                                    status={patient.status}
                                    ahvNumber={patient.ahv_number}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {data.total > data.per_page && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                            >
                                Zurück
                            </button>
                            <span className="text-sm text-slate-500">
                                Seite {page} von {Math.ceil(data.total / data.per_page)}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= Math.ceil(data.total / data.per_page)}
                                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                            >
                                Weiter
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
