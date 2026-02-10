"use client";

import { getLoginUrl } from "@/lib/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const IS_DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (IS_DEV_BYPASS) {
      // Dev mode: skip Keycloak, go straight to dashboard
      router.replace("/dashboard");
      return;
    }
    getLoginUrl().then((url) => {
      window.location.href = url;
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900 mt-4">🏥 PDMS Home-Spital</h1>
        <p className="text-slate-500 mt-2">Weiterleitung zum Login...</p>
      </div>
    </div>
  );
}
