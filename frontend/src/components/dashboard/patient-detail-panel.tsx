"use client";

import { usePatient } from "@/hooks/use-patients";
import { useContacts } from "@/hooks/use-contacts";

interface PatientDetailPanelProps {
    patientId: string | null;
}

function calculateAge(dob: string): number {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
}

function getInitials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function PatientDetailPanel({ patientId }: PatientDetailPanelProps) {
    const { data: patient, isLoading } = usePatient(patientId ?? "");
    const { data: contacts } = useContacts(patientId ?? "");

    if (!patientId) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-center min-h-[300px]">
                <p className="text-[11px] text-slate-400">Patient auswählen für Details</p>
            </div>
        );
    }

    if (isLoading || !patient) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-center min-h-[300px]">
                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // The API returns the full patient object; access extended fields via indexing
    const p = patient as Record<string, unknown>;
    const firstName = patient.first_name;
    const lastName = patient.last_name;
    const genderLabel = patient.gender === "female" ? "Weiblich" : patient.gender === "male" ? "Männlich" : "Divers";
    const age = calculateAge(patient.date_of_birth);
    const initials = getInitials(firstName, lastName);
    const addressCity = p.address_city as string | undefined;
    const addressStreet = p.address_street as string | undefined;
    const addressZip = p.address_zip as string | undefined;
    const phone = p.phone as string | undefined;
    const bloodType = p.blood_type as string | undefined;
    const language = p.language as string | undefined;
    const primaryContact = contacts?.find((c: Record<string, unknown>) => c.is_primary);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
            <h3 className="text-[13px] font-bold text-slate-900 mb-3">Patientendetails</h3>

            {/* Header */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-900">
                            {firstName} {lastName}
                        </p>
                        <p className="text-[10px] text-slate-500">
                            {age} Jahre · {genderLabel}
                            {language ? ` · ${language}` : ""}
                        </p>
                        {addressCity && (
                            <p className="text-[9px] text-slate-400">
                                🏠 {addressStreet ? `${addressStreet}, ` : ""}
                                {addressZip ? `${addressZip} ` : ""}
                                {addressCity}
                            </p>
                        )}
                        {phone && <p className="text-[9px] text-slate-400">📞 {phone}</p>}
                    </div>
                </div>
            </div>

            {/* Blood type + AHV */}
            <div className="flex gap-1.5 flex-wrap mb-3">
                {bloodType && (
                    <span className="text-[9px] font-semibold px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
                        🩸 {bloodType}
                    </span>
                )}
                {patient.ahv_number && (
                    <span className="text-[9px] font-medium px-2 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                        AHV: {patient.ahv_number}
                    </span>
                )}
            </div>

            {/* Emergency Contact */}
            {primaryContact && (
                <div className="mb-3">
                    <h4 className="text-[11px] font-bold text-slate-900 mb-1.5">Kontaktperson</h4>
                    <div className="bg-slate-50 rounded-lg px-2.5 py-2">
                        <p className="text-[9px] text-slate-900 font-medium">
                            {(primaryContact as Record<string, unknown>).relationship_type as string}:{" "}
                            {(primaryContact as Record<string, unknown>).name as string}
                        </p>
                        <p className="text-[9px] text-slate-400">
                            📞 {(primaryContact as Record<string, unknown>).phone as string}
                            {(primaryContact as Record<string, unknown>).is_legal_representative
                                ? " · Vertretungsberechtigt"
                                : ""}
                        </p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-1.5 mt-auto pt-2">
                <button className="text-[9px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 px-3 py-2 rounded-lg flex-1">
                    Vollprofil
                </button>
                <button className="text-[9px] font-semibold text-white bg-gradient-to-r from-violet-500 to-violet-600 px-3 py-2 rounded-lg flex-1">
                    Teleconsult
                </button>
                <button className="text-[9px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg flex-1">
                    EPD senden
                </button>
            </div>
        </div>
    );
}
