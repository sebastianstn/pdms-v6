/**
 * Utility functions — date formatting, AHV validation, etc.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind class merger */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date for Swiss locale */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

/** Format datetime for Swiss locale */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Format number compactly for Swiss locale (e.g. 89 instead of 89.0). */
export function formatCompactNumber(value: number, maxFractionDigits = 2): string {
  return new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/** Calculate age from date of birth */
export function calculateAge(dob: string | Date): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

/** Validate Swiss AHV number (756.XXXX.XXXX.XX) */
export function isValidAHV(ahv: string): boolean {
  return /^756\.\d{4}\.\d{4}\.\d{2}$/.test(ahv);
}

/**
 * Format free-text input to Swiss AHV format (XXX.XXXX.XXXX.XX).
 * Keeps only digits and inserts separators progressively while typing.
 */
export function formatAHVInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);

  if (!digits) {
    return "";
  }

  // Schweizer AHV beginnt immer mit 756.
  const normalizedDigits =
    digits.length <= 3 ? "756".slice(0, digits.length) : `756${digits.slice(3)}`.slice(0, 13);

  if (normalizedDigits.length <= 3) {
    return normalizedDigits;
  }

  if (normalizedDigits.length <= 7) {
    return `${normalizedDigits.slice(0, 3)}.${normalizedDigits.slice(3)}`;
  }

  if (normalizedDigits.length <= 11) {
    return `${normalizedDigits.slice(0, 3)}.${normalizedDigits.slice(3, 7)}.${normalizedDigits.slice(7)}`;
  }

  return `${normalizedDigits.slice(0, 3)}.${normalizedDigits.slice(3, 7)}.${normalizedDigits.slice(7, 11)}.${normalizedDigits.slice(11, 13)}`;
}
