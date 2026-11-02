"use client";

import { Check, X, Clock, Plane, Minus } from "lucide-react";
import { MatrixShiftStatus } from "./types";

export function MatrixStatusBadge({ status }: { status: MatrixShiftStatus }) {
  const norm = String(status || "").toLowerCase().trim();
  switch (norm) {
    case "available":
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto" title="Available">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    case "unavailable":
    case "not_available":
      return (
        <div className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto" title="Unavailable">
          <X className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
    case "pending":
      return (
        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mx-auto" title="Pending">
          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      );
    case "willing_to_travel":
      return (
        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mx-auto" title="Willing to Travel">
          <Plane className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      );
    case "not_sent":
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto" title="Not Sent">
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      );
  }
}
