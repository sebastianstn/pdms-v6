"use client";

import { getLoginUrl } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hospital } from "lucide-react";

const IS_DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
const DEV_LOGGED_OUT_KEY = "pdms_dev_logged_out";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, devLogin, login } = useAuth();
  // Erst nach dem Mount entscheiden, ob Dev-UI gezeigt wird (verhindert Hydration-Mismatch)
  const [mounted, setMounted] = useState(false);
  const [devLoggedOut, setDevLoggedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !IS_DEV_BYPASS) return;
    setDevLoggedOut(sessionStorage.getItem(DEV_LOGGED_OUT_KEY) === "true");
  }, [mounted]);

  // Wenn bereits eingeloggt, direkt zum Dashboard
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Produktions-Modus: direkt zu Keycloak weiterleiten
  useEffect(() => {
    const mode = searchParams.get("mode");
    const forceKeycloak = mode === "keycloak";

    if (mounted && !user && (!IS_DEV_BYPASS || forceKeycloak)) {
      getLoginUrl().then((url) => {
        window.location.href = url;
      });
    }
  }, [mounted, user, searchParams]);

  // Dev-Modus: Login-Button anzeigen (erst nach Hydration)
  if (mounted && IS_DEV_BYPASS && !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(http://localhost:8080/resources/w242x/login/keycloak/img/keycloak-bg.png)" }}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-10 max-w-sm w-full text-center">
          <div className="mx-auto w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
            <Hospital className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">PDMS Home-Spital</h1>
          <p className="text-sm text-slate-500 mt-2 mb-8">Patientendaten-Management-System</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                devLogin();
                router.replace("/dashboard");
              }}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Als Dev-Admin anmelden
            </button>

            <button
              onClick={() => login()}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-medium rounded-lg border border-slate-300 transition-colors"
            >
              Mit Keycloak anmelden
            </button>
          </div>

          <p className="text-xs text-amber-700 mt-4">
            Development-Modus — Dev-Bypass aktiv
            {devLoggedOut ? " (abgemeldet)" : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(http://localhost:8080/resources/w242x/login/keycloak/img/keycloak-bg.png)" }}
    >
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900 mt-4">PDMS Home-Spital</h1>
        <p className="text-slate-500 mt-2">Weiterleitung zum Login...</p>
      </div>
    </div>
  );
}
