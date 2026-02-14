"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    status: string;
    ahv_number?: string;
}

interface PatientListSidebarProps {
    patients: Patient[];
    isLoading: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

type FilterTab = "alle" | "kritisch" | "stabil";

function getInitials(first: string, last: string) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function getAge(dob: string) {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
}

function getStatusLabel(status: string) {
    switch (status) {
        case "critical": return { text: "Kritisch", bg: "bg-red-50", color: "text-red-600" };
        case "unstable": return { text: "Instabil", bg: "bg-amber-50", color: "text-amber-600" };
        default: return { text: "Stabil", bg: "bg-emerald-50", color: "text-emerald-600" };
    }
}

export function PatientListSidebar({ patients, isLoading, selectedId, onSelect }: PatientListSidebarProps) {
    const [filter, setFilter] = useState<FilterTab>("alle");

    const filteredPatients = patients.filter((p) => {
        if (filter === "alle") return true;
        if (filter === "kritisch") return p.status === "critical" || p.status === "unstable";
        return p.status === "active" || p.status === "stable";
    });

    const tabs: { key: FilterTab; label: string }[] = [
        { key: "alle", label: "Alle" },
        { key: "kritisch", label: "Kritisch" },
        { key: "stabil", label: "Stabil" },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Patienten</h3>
                    <span className="text-xs text-slate-500">{patients.length}</span>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 mt-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                "px-3 py-1 rounded-md text-[10px] font-semibold transition-all",
                                filter === tab.key
                                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Patient List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">Keine Patienten</p>
                ) : (
                    filteredPatients.map((patient) => {
                        const isSelected = patient.id === selectedId;
                        const initials = getInitials(patient.first_name, patient.last_name);
                        const age = getAge(patient.date_of_birth);
                        const statusInfo = getStatusLabel(patient.status);
                        const genderLabel = patient.gender === "female" ? "W" : patient.gender === "male" ? "M" : "D";

                        return (
                            <button
                                key={patient.id}
                                onClick={() => onSelect(patient.id)}
                                className={cn(
                                    "w-full text-left rounded-xl p-3 transition-all",
                                    isSelected
                                        ? "bg-cyan-50 border-[1.5px] border-cyan-500 shadow-sm"
                                        : "bg-white hover:bg-slate-50 border border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                                        isSelected
                                            ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white"
                                            : "bg-slate-100 text-slate-500"
                                    )}>
                                        {initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-semibold text-slate-900 truncate">
                                            {patient.first_name.charAt(0)}. {patient.last_name}
                                        </p>
                                        <p className="text-[9px] text-slate-500">
                                            {age}J · {genderLabel}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 mt-1.5 ml-[38px]">
                                    <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${statusInfo.bg} ${statusInfo.color}`}>
                                        {statusInfo.text}
                                    </span>
                                    {isSelected && (
                                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 inline-flex items-center gap-0.5">
                                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                                            Monitoring
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}

                {patients.length > 6 && (
                    <div className="text-center py-2">
                        <p className="text-[9px] text-slate-500">+{patients.length - 6} weitere</p>
                    </div>
                )}
            </div>
        </div>
    );
}
