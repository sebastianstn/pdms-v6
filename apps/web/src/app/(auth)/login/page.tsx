"use client";

import { getLoginUrl } from "@/lib/auth";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    getLoginUrl().then((url) => {
      window.location.href = url;
    });
  }, []);

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
