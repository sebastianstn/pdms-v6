"use client";

interface PatientDetailPanelProps {
  patientId: string | null;
}

// Demo-Daten
const DEMO_PATIENT = {
  initials: "AK",
  name: "Andreas König",
  age: 67,
  gender: "Männlich",
  weight: "82kg",
  address: "Rue de la Gare 12, Payerne",
  phone: "026 660 12 34",
  admissionDate: "05.02.2026",
  diagnoses: [
    { code: "J18.9", text: "Pneumonie, nicht näher bezeichn.", severity: "critical" },
    { code: "I10", text: "Essentielle Hypertonie", severity: "normal" },
    { code: "E11.9", text: "Diabetes mellitus Typ 2", severity: "normal" },
  ],
  allergies: [
    { name: "Penicillin", severity: "critical" },
    { name: "Latex", severity: "warning" },
  ],
  contact: {
    name: "Maria König",
    relation: "Ehefrau",
    phone: "026 660 12 35",
    isEmergency: true,
  },
  careGoal: "i.v. Antibiotika → oral Umstellung Tag 5",
};

export function PatientDetailPanel({ patientId }: PatientDetailPanelProps) {
  if (!patientId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-center min-h-[300px]">
        <p className="text-[11px] text-slate-400">Patient auswählen für Details</p>
      </div>
    );
  }

  const p = DEMO_PATIENT;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
      <h3 className="text-[13px] font-bold text-slate-900 mb-3">Patientendetails</h3>

      {/* Patient Info Card */}
      <div className="bg-slate-50 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {p.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900">{p.name}</p>
            <p className="text-[10px] text-slate-500">{p.age} Jahre · {p.gender} · {p.weight}</p>
            <p className="text-[9px] text-slate-400">🏠 {p.address}</p>
            <p className="text-[9px] text-slate-400">📞 {p.phone} · Aufn. {p.admissionDate}</p>
          </div>
        </div>
      </div>

      {/* Diagnosen */}
      <div className="mb-3">
        <h4 className="text-[11px] font-bold text-slate-900 mb-1.5">Diagnosen</h4>
        <div className="space-y-1">
          {p.diagnoses.map((d, i) => (
            <div
              key={i}
              className={`px-2.5 py-1.5 rounded-md text-[9px] ${
                d.severity === "critical"
                  ? "bg-red-50 text-red-700"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              <span className="font-medium">{d.code}</span> — {d.text}
            </div>
          ))}
        </div>
      </div>

      {/* Allergien */}
      <div className="mb-3">
        <h4 className="text-[11px] font-bold text-slate-900 mb-1.5">Allergien</h4>
        <div className="flex gap-1.5 flex-wrap">
          {p.allergies.map((a, i) => (
            <span
              key={i}
              className={`text-[9px] font-semibold px-2 py-1 rounded-md border ${
                a.severity === "critical"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              ⚠ {a.name}
            </span>
          ))}
        </div>
      </div>

      {/* Kontakt */}
      <div className="mb-3">
        <h4 className="text-[11px] font-bold text-slate-900 mb-1.5">Kontaktpersonen</h4>
        <div className="bg-slate-50 rounded-lg px-2.5 py-2">
          <p className="text-[9px] text-slate-900 font-medium">
            {p.contact.relation}: {p.contact.name}
          </p>
          <p className="text-[9px] text-slate-400">
            📞 {p.contact.phone} · {p.contact.isEmergency ? "Notfallkontakt" : ""}
          </p>
        </div>
      </div>

      {/* Pflegeplan */}
      <div className="mb-3">
        <h4 className="text-[11px] font-bold text-slate-900 mb-1.5">Pflegeplan-Status</h4>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-2">
          <p className="text-[9px] text-slate-500">Behandlungsziel</p>
          <p className="text-[10px] font-semibold text-emerald-700">{p.careGoal}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1.5 mt-auto pt-2">
        <button className="text-[9px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 px-3 py-2 rounded-lg flex-1">
          FHIR Export
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
