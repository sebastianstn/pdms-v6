"use client";

import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";
import { ComplianceBanner } from "@/components/legal/compliance-banner";
import { ConsentOverview } from "@/components/legal/consent-overview";
import { DirectiveList } from "@/components/legal/directive-list";
import { WishesForm } from "@/components/legal/wishes-form";
import { PalliativeCard } from "@/components/legal/palliative-card";
import { DeathNotificationList } from "@/components/legal/death-notification-list";

export default function RechtlichePage() {
  const { patientId } = useParams<{ patientId: string }>();

  return (
    <div className="space-y-6">
      {/* Compliance-Banner */}
      <ComplianceBanner patientId={patientId} />

      {/* Einwilligungen */}
      <Card>
        <CardContent>
          <ConsentOverview patientId={patientId} />
        </CardContent>
      </Card>

      {/* Patientenverfügungen */}
      <Card>
        <CardContent>
          <DirectiveList patientId={patientId} />
        </CardContent>
      </Card>

      {/* Mutmasslicher Wille (ZGB 378) */}
      <WishesForm patientId={patientId} />

      {/* Palliative Care */}
      <PalliativeCard patientId={patientId} />

      {/* Todesfall-Mitteilungen */}
      <Card>
        <CardContent>
          <DeathNotificationList patientId={patientId} />
        </CardContent>
      </Card>
    </div>
  );
}
