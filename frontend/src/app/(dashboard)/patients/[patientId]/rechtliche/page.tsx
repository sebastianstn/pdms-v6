"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui";
import { ComplianceBanner } from "@/components/legal/compliance-banner";
import { ConsentOverview } from "@/components/legal/consent-overview";
import { DirectiveList } from "@/components/legal/directive-list";
import { WishesForm } from "@/components/legal/wishes-form";
import { PalliativeCard } from "@/components/legal/palliative-card";
import { DeathNotificationList } from "@/components/legal/death-notification-list";

export default function RechtlichePage() {
  const { patientId } = useParams<{ patientId: string }>();

  return (
    <div className="space-y-1.5">
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
    </div>
  );
}
