"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCode, saveTokens } from "@/lib/auth";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Kein Authorization-Code erhalten");
      return;
    }

    exchangeCode(code)
      .then((tokens) => {
        saveTokens(tokens.access_token, tokens.refresh_token);
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error("Token exchange error:", err);
        setError("Anmeldung fehlgeschlagen. Bitte erneut versuchen.");
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <a href="/login" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            Zurück zum Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-slate-500">Anmeldung wird verarbeitet...</p>
      </div>
    </div>
  );
}
