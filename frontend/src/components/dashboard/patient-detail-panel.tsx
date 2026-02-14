"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePatient } from "@/hooks/use-patients";
import { useContacts } from "@/hooks/use-contacts";
import { api } from "@/lib/api-client";
import { jsPDF } from "jspdf";
import { Home, Phone, Droplets } from "lucide-react";

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
    const router = useRouter();
    const [isExportingEpd, setIsExportingEpd] = useState(false);
    const [epdFeedback, setEpdFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const { data: patient, isLoading } = usePatient(patientId ?? "");
    const { data: contacts } = useContacts(patientId ?? "");

    const exportEpdPdf = (payload: Record<string, unknown>, currentPatientId: string) => {
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const pageHeight = 297;
        const pageWidth = 210;
        const margin = 12;
        const textWidth = pageWidth - margin * 2;

        const bundle = payload as {
            total?: number;
            entry?: Array<{ resource?: Record<string, unknown> }>;
        };

        const patientResource = bundle.entry?.find(
            (e) => e.resource?.resourceType === "Patient",
        )?.resource;

        const patientNameRaw = Array.isArray(patientResource?.name)
            ? (patientResource?.name[0] as Record<string, unknown> | undefined)
            : undefined;
        const given = Array.isArray(patientNameRaw?.given)
            ? String(patientNameRaw?.given.join(" "))
            : "";
        const family = typeof patientNameRaw?.family === "string" ? patientNameRaw.family : "";
        const patientName = `${given} ${family}`.trim() || "Unbekannt";

        const resourceCount = Array.isArray(bundle.entry) ? bundle.entry.length : 0;

        const contentStartY = 46;
        let y = contentStartY;

        const drawHeader = () => {
            doc.setDrawColor(14, 165, 233);
            doc.setLineWidth(0.6);
            doc.rect(margin, 10, pageWidth - margin * 2, 28);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("PDMS Home-Spital", margin + 3, 18);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text("EPD-Auszug (PDF)", margin + 3, 24);
            doc.text(`Exportzeitpunkt: ${new Date().toLocaleString("de-CH")}`, margin + 3, 29);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(`Patient: ${patientName}`, margin + 3, 35);
            doc.setFont("helvetica", "normal");
            doc.text(`Patient-ID: ${currentPatientId}`, pageWidth - margin - 72, 35);
        };

        const drawFooter = (page: number, totalPages: number) => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text("Vertraulich — PDMS Home-Spital", margin, pageHeight - 8);
            doc.text(`Seite ${page}/${totalPages}`, pageWidth - margin - 18, pageHeight - 8);
            doc.setTextColor(0);
        };

        const ensureSpace = (needed = 8) => {
            if (y + needed > pageHeight - 20) {
                doc.addPage();
                drawHeader();
                y = contentStartY;
            }
        };

        const writeLine = (text: string, size = 10, bold = false) => {
            ensureSpace(6);
            doc.setFont("helvetica", bold ? "bold" : "normal");
            doc.setFontSize(size);
            const lines = doc.splitTextToSize(text, textWidth);
            doc.text(lines, margin, y);
            y += lines.length * (size * 0.45) + 2;
        };

        drawHeader();

        writeLine("Dokumentzusammenfassung", 11, true);
        writeLine(`FHIR-Ressourcen im Bundle: ${bundle.total ?? resourceCount}`);
        writeLine("Erstellt zur Weitergabe im EPD-Kontext (PDF-Übersicht).", 9);

        writeLine("", 8);
        writeLine("Ressourcen nach Typ", 11, true);

        const typeCounts = new Map<string, number>();
        for (const item of bundle.entry ?? []) {
            const rt = typeof item.resource?.resourceType === "string" ? item.resource.resourceType : "Unknown";
            typeCounts.set(rt, (typeCounts.get(rt) ?? 0) + 1);
        }

        if (typeCounts.size === 0) {
            writeLine("Keine Ressourcen im Bundle enthalten.");
        } else {
            for (const [resourceType, count] of typeCounts.entries()) {
                writeLine(`• ${resourceType}: ${count}`);
            }
        }

        writeLine("", 8);
        writeLine("Klinischer Hinweis", 11, true);
        writeLine("Dieses PDF enthält eine lesbare Zusammenfassung des FHIR-$everything Exports.");
        writeLine("Für strukturierte Interoperabilität bleibt FHIR-JSON die führende Datengrundlage.");

        ensureSpace(26);
        y += 6;
        doc.setDrawColor(180);
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + 70, y);
        doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Ort/Datum", margin, y + 4);
        doc.text("Unterschrift / Visum", pageWidth - margin - 70, y + 4);

        const totalPages = doc.getNumberOfPages();
        for (let page = 1; page <= totalPages; page += 1) {
            doc.setPage(page);
            drawFooter(page, totalPages);
        }

        doc.save(`epd-patient-${currentPatientId}.pdf`);
    };

    const handleOpenFullProfile = () => {
        if (!patientId) return;
        router.push(`/patients/${patientId}/personalien`);
    };

    const handleOpenTeleconsult = () => {
        if (!patientId) return;
        router.push(`/patients/${patientId}/termine`);
    };

    const handleExportEpd = async () => {
        if (!patientId || isExportingEpd) return;
        setIsExportingEpd(true);
        setEpdFeedback(null);

        try {
            const payload = await api.get<Record<string, unknown>>(`/fhir/Patient/${patientId}/$everything`);
            exportEpdPdf(payload, patientId);
            setEpdFeedback({ type: "success", message: "EPD-Export als PDF erfolgreich heruntergeladen." });
        } catch {
            setEpdFeedback({ type: "error", message: "EPD-Export fehlgeschlagen. Bitte erneut versuchen." });
        } finally {
            setIsExportingEpd(false);
        }
    };

    if (!patientId) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-center min-h-[300px]">
                <p className="text-[11px] text-slate-500">Patient auswählen für Details</p>
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

    const firstName = patient.first_name;
    const lastName = patient.last_name;
    const genderLabel = patient.gender === "female" ? "Weiblich" : patient.gender === "male" ? "Männlich" : "Divers";
    const age = calculateAge(patient.date_of_birth);
    const initials = getInitials(firstName, lastName);
    const addressCity = patient.address_city;
    const addressStreet = patient.address_street;
    const addressZip = patient.address_zip;
    const phone = patient.phone;
    const bloodType = patient.blood_type;
    const language = patient.language;
    const primaryContact = contacts?.find((c) => c.is_primary);

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
                            <p className="text-[9px] text-slate-500 inline-flex items-center gap-0.5">
                                <Home className="w-2.5 h-2.5" /> {addressStreet ? `${addressStreet}, ` : ""}
                                {addressZip ? `${addressZip} ` : ""}
                                {addressCity}
                            </p>
                        )}
                        {phone && <p className="text-[9px] text-slate-500 inline-flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {phone}</p>}
                    </div>
                </div>
            </div>

            {/* Blood type + AHV */}
            <div className="flex gap-1.5 flex-wrap mb-3">
                {bloodType && (
                    <span className="text-[9px] font-semibold px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-0.5">
                        <Droplets className="w-3 h-3" /> {bloodType}
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
                            {primaryContact.relationship_type}: {primaryContact.name}
                        </p>
                        <p className="text-[9px] text-slate-500">
                            ☎ {primaryContact.phone}
                            {primaryContact.is_legal_representative
                                ? " · Vertretungsberechtigt"
                                : ""}
                        </p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-1.5 mt-auto pt-2">
                <button
                    type="button"
                    onClick={handleOpenFullProfile}
                    className="text-[9px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 px-3 py-2 rounded-lg flex-1"
                >
                    Vollprofil
                </button>
                <button
                    type="button"
                    onClick={handleOpenTeleconsult}
                    className="text-[9px] font-semibold text-white bg-gradient-to-r from-violet-500 to-violet-600 px-3 py-2 rounded-lg flex-1"
                >
                    Teleconsult
                </button>
                <button
                    type="button"
                    onClick={handleExportEpd}
                    disabled={isExportingEpd}
                    className="text-[9px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg flex-1 disabled:opacity-50"
                >
                    {isExportingEpd ? "Export …" : "EPD senden"}
                </button>
            </div>

            {epdFeedback && (
                <div
                    className={`mt-2 rounded-md px-2.5 py-1.5 text-[9px] font-medium border ${epdFeedback.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                        }`}
                    role="status"
                    aria-live="polite"
                >
                    {epdFeedback.message}
                </div>
            )}
        </div>
    );
}
