"use client";

import { Badge } from "@/components/ui";

// ─── RBAC-Matrix ─────────────────────────────────────────────

interface AccessRight {
  resource: string;
  arzt: "R" | "RW" | "—";
  pflege: "R" | "RW" | "—";
  admin: "R" | "RW" | "—";
}

const ACCESS_MATRIX: AccessRight[] = [
  { resource: "Patientenstammdaten", arzt: "RW", pflege: "R", admin: "RW" },
  { resource: "Vitalparameter", arzt: "RW", pflege: "RW", admin: "R" },
  { resource: "Medikamente", arzt: "RW", pflege: "R", admin: "R" },
  { resource: "Medikamentengabe", arzt: "R", pflege: "RW", admin: "R" },
  { resource: "Klinische Notizen", arzt: "RW", pflege: "R", admin: "R" },
  { resource: "Pflege-Dokumentation", arzt: "R", pflege: "RW", admin: "R" },
  { resource: "Pflegediagnosen", arzt: "R", pflege: "RW", admin: "R" },
  { resource: "Aufenthalte", arzt: "RW", pflege: "R", admin: "RW" },
  { resource: "Termine", arzt: "RW", pflege: "RW", admin: "RW" },
  { resource: "Einwilligungen", arzt: "RW", pflege: "R", admin: "RW" },
  { resource: "Patientenverfügungen", arzt: "RW", pflege: "R", admin: "RW" },
  { resource: "Konsilien", arzt: "RW", pflege: "R", admin: "R" },
  { resource: "Arztbriefe", arzt: "RW", pflege: "R", admin: "R" },
  { resource: "Laborwerte", arzt: "RW", pflege: "R", admin: "R" },
  { resource: "I/O-Bilanz", arzt: "R", pflege: "RW", admin: "R" },
  { resource: "Therapiepläne", arzt: "RW", pflege: "R", admin: "R" },
  { resource: "Hausbesuche", arzt: "R", pflege: "RW", admin: "RW" },
  { resource: "Teleconsults", arzt: "RW", pflege: "R", admin: "R" },
  { resource: "Remote-Geräte", arzt: "R", pflege: "RW", admin: "RW" },
  { resource: "Selbstmedikation", arzt: "R", pflege: "RW", admin: "R" },
  { resource: "Ernährung", arzt: "RW", pflege: "R", admin: "R" },
  { resource: "Verbrauchsmaterial", arzt: "R", pflege: "RW", admin: "RW" },
  { resource: "Schichtübergabe", arzt: "R", pflege: "RW", admin: "R" },
  { resource: "Alarme", arzt: "RW", pflege: "RW", admin: "RW" },
  { resource: "Audit-Trail", arzt: "—", pflege: "—", admin: "R" },
  { resource: "Benutzerverwaltung", arzt: "—", pflege: "—", admin: "RW" },
];

function AccessBadge({ access }: { access: "R" | "RW" | "—" }) {
  if (access === "RW") {
    return <Badge variant="success">Lesen/Schreiben</Badge>;
  }
  if (access === "R") {
    return <Badge variant="info">Nur Lesen</Badge>;
  }
  return <Badge variant="default">Kein Zugriff</Badge>;
}

/** Zeigt die RBAC-Zugriffs-Matrix mit R/W-Berechtigungen pro Rolle. */
export function AccessRightsMatrix() {
  return (
    <div>
      <p className="text-sm text-slate-500 mb-3">
        Übersicht der Zugriffsberechtigungen nach Rolle gemäss IEC 62304 und nDSG.
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
            <tr>
              <th className="px-3 py-2">Ressource</th>
              <th className="px-3 py-2 text-center">Arzt</th>
              <th className="px-3 py-2 text-center">Pflege</th>
              <th className="px-3 py-2 text-center">Admin</th>
            </tr>
          </thead>
          <tbody>
            {ACCESS_MATRIX.map((row) => (
              <tr key={row.resource} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium">{row.resource}</td>
                <td className="px-3 py-2 text-center">
                  <AccessBadge access={row.arzt} />
                </td>
                <td className="px-3 py-2 text-center">
                  <AccessBadge access={row.pflege} />
                </td>
                <td className="px-3 py-2 text-center">
                  <AccessBadge access={row.admin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        IEC 62304 konform · nDSG Art. 5c (besonders schützenswerte Personendaten)
      </p>
    </div>
  );
}
