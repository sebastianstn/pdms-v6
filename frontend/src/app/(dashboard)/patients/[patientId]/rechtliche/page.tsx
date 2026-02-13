"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";
import { ComplianceBanner } from "@/components/legal/compliance-banner";
import { ConsentOverview } from "@/components/legal/consent-overview";
import { DirectiveList } from "@/components/legal/directive-list";
import { WishesForm } from "@/components/legal/wishes-form";
import { PalliativeCard } from "@/components/legal/palliative-card";
import { DeathNotificationList } from "@/components/legal/death-notification-list";
import { AuditLogTable, AccessRightsMatrix } from "@/components/audit";

type Tab = "legal" | "audit" | "access";

export default function RechtlichePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("legal");

  const tabs: { key: Tab; label: string }[] = [
    { key: "legal", label: "Einwilligungen & Verfügungen" },
    { key: "audit", label: "Audit-Trail" },
    { key: "access", label: "Zugriffsberechtigte" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab-Navigation */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Einwilligungen & Verfügungen ── */}
      {activeTab === "legal" && (
        <>
          <ComplianceBanner patientId={patientId} />

          <Card>
            <CardContent>
              <ConsentOverview patientId={patientId} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <DirectiveList patientId={patientId} />
            </CardContent>
          </Card>

          <WishesForm patientId={patientId} />
          <PalliativeCard patientId={patientId} />

          <Card>
            <CardContent>
              <DeathNotificationList patientId={patientId} />
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Tab: Audit-Trail (EPD & Zugriffsprotokolle) ── */}
      {activeTab === "audit" && (
        <Card>
          <CardHeader>
            <CardTitle>Zugriffsprotokolle (Audit-Trail)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Protokollierung aller Datenzugriffe und -änderungen gemäss IEC 62304
              und nDSG. Nur für Administratoren einsehbar.
            </p>
            <AuditLogTable patientId={patientId} />
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Zugriffsberechtigte ── */}
      {activeTab === "access" && (
        <Card>
          <CardHeader>
            <CardTitle>Zugriffsberechtigte (RBAC-Matrix)</CardTitle>
          </CardHeader>
          <CardContent>
            <AccessRightsMatrix />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
