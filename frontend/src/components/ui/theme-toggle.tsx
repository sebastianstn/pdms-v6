/**
 * Theme-Toggle — Umschalter für Dark/Light/System Mode
 */
"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const options = [
        { value: "light" as const, icon: Sun, label: "Hell" },
        { value: "dark" as const, icon: Moon, label: "Dunkel" },
        { value: "system" as const, icon: Monitor, label: "System" },
    ];

    return (
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            {options.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`rounded-md p-1.5 text-sm transition-colors ${theme === value
                            ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                    title={label}
                    aria-label={label}
                >
                    <Icon className="h-4 w-4" />
                </button>
            ))}
        </div>
    );
}

/** Einfacher Toggle-Button (nur hell/dunkel) */
export function ThemeToggleSimple() {
    const { resolvedTheme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700
        dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label={resolvedTheme === "dark" ? "Heller Modus" : "Dunkler Modus"}
        >
            {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </button>
    );
}
