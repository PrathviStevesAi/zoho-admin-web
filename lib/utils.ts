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

    default:
      return `${base} bg-slate-100 text-slate-700 border border-slate-200`;
  }
}

export function formatStatus(status: string) {
  if (!status) return "";
  return status.replace(/_/g, " ").toUpperCase();
}