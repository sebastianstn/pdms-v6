"use client";

import Link from "next/link";
import { formatDate, calculateAge } from "@/lib/utils";
import { User } from "lucide-react";

interface PatientCardProps {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  ahvNumber?: string;
}

export function PatientCard({ id, firstName, lastName, dateOfBirth, gender, status, ahvNumber }: PatientCardProps) {
  const age = calculateAge(dateOfBirth);

  return (
    <Link
      href={`/patients/${id}/personalien`}
      className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <User className={`w-5 h-5 ${gender === "female" ? "text-pink-500" : "text-blue-500"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{lastName}, {firstName}</p>
          <p className="text-xs text-slate-500">{formatDate(dateOfBirth)} · {age} Jahre{ahvNumber ? ` · ${ahvNumber}` : ""}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          status === "active" ? "bg-green-50 text-green-700" :
          status === "discharged" ? "bg-slate-100 text-slate-600" :
          "bg-red-50 text-red-700"
        }`}>
          {status === "active" ? "Aktiv" : status === "discharged" ? "Entlassen" : "Verstorben"}
        </span>
      </div>
    </Link>
  );
}
