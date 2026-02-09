"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PatientDefaultPage() {
    const { patientId } = useParams<{ patientId: string }>();
    const router = useRouter();

    useEffect(() => {
        router.replace(`/patients/${patientId}/personalien`);
    }, [patientId, router]);

    return null;
}
