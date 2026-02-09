"use client";

import { useEffect } from "react";
import { getLogoutUrl, clearTokens } from "@/lib/auth";

export default function LogoutPage() {
  useEffect(() => {
    clearTokens();
    window.location.href = getLogoutUrl();
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
