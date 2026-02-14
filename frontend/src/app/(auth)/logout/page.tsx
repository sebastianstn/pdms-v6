"use client";

import { useEffect } from "react";
import { getLogoutUrl, clearTokens } from "@/lib/auth";

const IS_DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default function LogoutPage() {
  useEffect(() => {
    clearTokens();
    if (IS_DEV_BYPASS) {
      sessionStorage.setItem("pdms_dev_logged_out", "true");
      window.location.href = "/login?mode=keycloak";
    } else {
      window.location.href = getLogoutUrl();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-slate-400 border-t-transparent rounded-full mx-auto" />
        <p className="text-slate-500 mt-4">Abmeldung...</p>
      </div>
    </div>
  );
}
