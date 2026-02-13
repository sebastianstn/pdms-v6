/**
 * PDMS Home-Spital — i18n Konfiguration
 * Unterstützte Sprachen: de (Standard), fr, it, en
 * Schweizer Landessprachen + Englisch
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import de from "./locales/de.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";

/** Verfügbare Sprachen */
export const LANGUAGES = [
    { code: "de", label: "Deutsch", flag: "🇨🇭" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "en", label: "English", flag: "🇬🇧" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

/** Sprache aus localStorage oder Browser-Einstellung ermitteln */
function getDefaultLanguage(): LanguageCode {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("pdms-language");
        if (stored && LANGUAGES.some((l) => l.code === stored)) {
            return stored as LanguageCode;
        }
        const browserLang = navigator.language.split("-")[0];
        if (LANGUAGES.some((l) => l.code === browserLang)) {
            return browserLang as LanguageCode;
        }
    }
    return "de";
}

i18n.use(initReactI18next).init({
    resources: {
        de: { translation: de },
        fr: { translation: fr },
        it: { translation: it },
        en: { translation: en },
    },
    lng: getDefaultLanguage(),
    fallbackLng: "de",
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
});

/** Sprache wechseln und in localStorage speichern */
export function changeLanguage(lang: LanguageCode): void {
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") {
        localStorage.setItem("pdms-language", lang);
    }
}

export default i18n;
