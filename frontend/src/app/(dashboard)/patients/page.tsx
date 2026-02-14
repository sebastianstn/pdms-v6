"use client";

import { useState } from "react";
import { usePatients } from "@/hooks/use-patients";
import { ApiError } from "@/lib/api-client";
import Link from "next/link";
import { PatientCard } from "@/components/patients/patient-card";
import { useUserPermissions } from "@/hooks/use-rbac";
import type { Patient } from "@pdms/shared-types";

interface PaginatedPatients {
    items: Patient[];
    total: number;
    page: number;
    per_page: number;
}

const DEMO_PATIENTS: Patient[] = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        ahv_number: "756.1111.2222.33",
        first_name: "Anna",
        last_name: "Muster",
        date_of_birth: "1958-05-17",
        gender: "female",
        blood_type: "A+",
        phone: "+41 79 555 11 22",
        email: "anna.muster@demo.local",
        address_street: "Bahnhofstrasse 12",
        address_zip: "8001",
        address_city: "Zürich",
        address_canton: "ZH",
        photo_url: undefined,
        language: "de",
        status: "active",
        created_at: "2026-01-10T10:00:00Z",
        updated_at: "2026-02-10T10:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        ahv_number: "756.2222.3333.44",
        first_name: "Luca",
        last_name: "Keller",
        date_of_birth: "1949-11-03",
        gender: "male",
        blood_type: "0+",
        phone: "+41 78 444 22 33",
        email: "luca.keller@demo.local",
        address_street: "Seestrasse 44",
        address_zip: "6003",
        address_city: "Luzern",
        address_canton: "LU",
        photo_url: undefined,
        language: "de",
        status: "active",
        created_at: "2026-01-08T08:00:00Z",
        updated_at: "2026-02-09T08:00:00Z",
    },
    {
        id: "00000000-0000-0000-0000-000000000003",
        ahv_number: "756.3333.4444.55",
        first_name: "Mia",
        last_name: "Berger",
        date_of_birth: "1971-02-24",
        gender: "female",
        blood_type: "B+",
        phone: "+41 76 333 44 55",
        email: "mia.berger@demo.local",
        address_street: "Dorfweg 7",
        address_zip: "3011",
        address_city: "Bern",
        address_canton: "BE",
        photo_url: undefined,
        language: "de",
        status: "discharged",
        created_at: "2026-01-05T09:30:00Z",
        updated_at: "2026-02-07T09:30:00Z",
    },
];

function buildDemoPatientsPage(page: number, search?: string): PaginatedPatients {
    const term = (search || "").trim().toLowerCase();
    const filtered = term
        ? DEMO_PATIENTS.filter((p) => {
              const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
              return fullName.includes(term) || (p.ahv_number || "").toLowerCase().includes(term);
          })
        : DEMO_PATIENTS;

    const perPage = 20;
    const start = (page - 1) * perPage;
    const end = start + perPage;

    return {
        items: filtered.slice(start, end),
        total: filtered.length,
        page,
        per_page: perPage,
    };
}

export default function PatientsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data, isLoading, isFetching, error, refetch } = usePatients(page, search || undefined);
    const { canWrite } = useUserPermissions();

    const isBackendUnavailable =
        error instanceof ApiError
            ? [408, 500, 502, 503, 504].includes(error.status)
            : Boolean(error && /network|fetch|timeout|offline|internal server error/i.test(error.message));

    const usesDemoFallback = !data && !!error && isBackendUnavailable;
    const effectiveData = data ?? (usesDemoFallback ? buildDemoPatientsPage(page, search || undefined) : undefined);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Patienten</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {effectiveData
                            ? `${effectiveData.total} Patienten${usesDemoFallback ? " (Demo-Daten)" : ""}`
                            : "Wird geladen..."}
                    </p>
                </div>
                {canWrite("Patientenstammdaten") && (
                    <Link
                        href="/patients/new"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        + Neuer Patient
                    </Link>
                )}
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
                    className="w-full max-w-md px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
            </div>

            {usesDemoFallback && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-4 mb-4 text-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <span>Backend aktuell nicht erreichbar. Es werden Demo-Daten angezeigt, bis die Verbindung wieder verfügbar ist.</span>
                    <button
                        type="button"
                        onClick={() => {
                            void refetch();
                        }}
                        disabled={isFetching}
                        className="inline-flex items-center justify-center rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50"
                    >
                        {isFetching ? "Prüfe Verbindung..." : "Erneut versuchen"}
                    </button>
                </div>
            )}

            {/* Fehler */}
            {error && !usesDemoFallback && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm">
                    Fehler beim Laden: {error.message}
                </div>
            )}

            {/* Laden */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            )}

            {/* Patientenliste */}
            {effectiveData && (
                <>
                    {effectiveData.items.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                            <p className="text-slate-500">Keine Patienten gefunden</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                            {effectiveData.items.map((patient) => (
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
                    {effectiveData.total > effectiveData.per_page && (
                        <div className="flex items-center justify-center gap-1.5 mt-6">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
                            >
                                Zurück
                            </button>
                            <span className="text-sm text-slate-500">
                                Seite {page} von {Math.ceil(effectiveData.total / effectiveData.per_page)}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= Math.ceil(effectiveData.total / effectiveData.per_page)}
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
