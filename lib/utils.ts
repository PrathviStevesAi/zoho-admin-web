import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusBadgeClass(status: string) {
  const base = "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap";

  switch (status.toUpperCase()) {
    case "NEW":
    case "NEW_PROJECT":
      return `${base} bg-blue-100 text-blue-700 border border-blue-200`;

    case "PRE CHECK-IN":
    case "SHIFT_PRE_CHECK_IN":
      return `${base} bg-amber-100 text-amber-700 border border-amber-200`;

    case "IN PROGRESS":
    case "SHIFT_IN_PROGRESS":
      return `${base} bg-indigo-100 text-indigo-700 border border-indigo-200`;

    case "FINISHED":
    case "SHIFT_FINISHED":
      return `${base} bg-emerald-100 text-emerald-700 border border-emerald-200`;

    case "REFUSED":
    case "SHIFT_REFUSED":
      return `${base} bg-red-100 text-red-700 border border-red-200`;

    case "ABANDON":
    case "SHIFT_ABANDON":
      return `${base} bg-orange-100 text-orange-700 border border-orange-200`;

    case "APPROVED":
    case "SHIFT_APPROVED":
      return `${base} bg-green-100 text-green-700 border border-green-200`;

    case "NOT_APPROVED":
    case "SHIFT_NOT_APPROVED":
      return `${base} bg-red-100 text-red-700 border border-red-200`;

    default:
      return `${base} bg-slate-100 text-slate-700 border border-slate-200`;
  }
}

export function formatStatus(status: string) {
  if (!status) return "";
  return status.replace(/_/g, ' ').toUpperCase();
}

export function formatTitleCase(str: string) {
  if (!str) return "";
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatDate(dateInput: string | Date | null | undefined, includeTime: boolean = true, timezone?: string) {
  if (!dateInput) return "";

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      timeZone: timezone
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    const options = includeTime ? { ...dateOptions, ...timeOptions } : dateOptions;

    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch (err) {
    return "";
  }
}

/**
 * Formats a date/time string exactly as provided by the backend API without
 * adjusting for the client browser's local time zone.
 * Handles ISO (e.g. "2026-09-15T12:30:00+05:30") and SQL (e.g. "2026-09-15 12:56:21.742116+05:30") formats.
 */
export function formatExactApiDateTime(
  dateInput: string | null | undefined,
  includeTime: boolean = true
): string {
  if (!dateInput || typeof dateInput !== "string") return dateInput || "";

  const trimmed = dateInput.trim();
  if (!trimmed) return "";

  // Match ISO or SQL format: YYYY-MM-DD or YYYY-MM-DD[T or space]HH:mm(:ss)?
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (!match) {
    return formatDate(trimmed, includeTime) || trimmed;
  }

  const year = match[1];
  const month = match[2].padStart(2, "0");
  const day = match[3].padStart(2, "0");
  const formattedDate = `${month}/${day}/${year}`;

  if (!includeTime || match[4] === undefined || match[5] === undefined) {
    return formattedDate;
  }

  let hourNum = parseInt(match[4], 10);
  const minute = match[5].padStart(2, "0");
  const ampm = hourNum >= 12 ? "PM" : "AM";
  hourNum = hourNum % 12 || 12;
  const hourStr = String(hourNum).padStart(2, "0");

  return `${formattedDate}, ${hourStr}:${minute} ${ampm}`;
}

import { Country } from "country-state-city";

export function toFullCountryName(countryInput?: string | null): string {
  if (!countryInput) return "";
  const trimmed = countryInput.trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (upper === "US" || upper === "USA") return "United States";
  if (upper === "CA" || upper === "CAN" || upper === "CN") return "Canada";
  const fromCode = Country.getCountryByCode(trimmed)?.name;
  if (fromCode) return fromCode;
  const matchByName = Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchByName) return matchByName.name;
  return trimmed;
}

