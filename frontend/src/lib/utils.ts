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
  return /^\d{3}\.\d{4}\.\d{4}\.\d{2}$/.test(ahv);
}
