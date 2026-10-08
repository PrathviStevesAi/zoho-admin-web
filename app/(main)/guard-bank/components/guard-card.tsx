"use client";

import { useRouter } from "next/navigation";
import { Trash2, User, Building2, MapPin, Mail, Phone, Eye, UserCheck, UserX, Shield } from "lucide-react";

interface GuardCardProps {
  guard: {
    id: string;
    first_name?: string;
    last_name?: string;
    city?: string;
    state?: string;
    country?: string;
    email?: string;
    phone_number?: string;
    performed_by?: string | null;
    account_status?: string | null;
  };
  status: "record_touched" | "approved" | "disqualified";
  onDelete?: (id: string) => void;
}

export function GuardCard({ guard, status, onDelete }: GuardCardProps) {
  const router = useRouter();

  if (!guard || typeof guard !== "object") return null;

  const firstName = typeof guard.first_name === "string" ? guard.first_name : "";
  const lastName = typeof guard.last_name === "string" ? guard.last_name : "";
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown Guard";

  const city = typeof guard.city === "string" ? guard.city : "";
  const state = typeof guard.state === "string" ? guard.state : "";
  const country = typeof guard.country === "string" ? guard.country : "";
  const locationText = [state, country].filter(Boolean).join(", ") || "-";

  const email = typeof guard.email === "string" ? guard.email : "-";
  const phoneNumber = typeof guard.phone_number === "string" || typeof guard.phone_number === "number" ? String(guard.phone_number) : "-";
  const performedBy = typeof guard.performed_by === "string" ? guard.performed_by : "";

  const getPerformedBySection = () => {
    if (!performedBy) return null;

    if (status === "record_touched") {
      return (
        <div className="flex items-center gap-2 text-[12px] text-black">
          <Eye className="w-3.5 h-3.5 text-teal-600" />
          <span className="truncate" title={performedBy}>{performedBy}</span>
        </div>
      );
    }

    if (status === "approved") {
      return (
        <div className="flex items-center gap-2 text-[12px] text-black">
          <UserCheck className="w-3.5 h-3.5 text-green-600" />
          <span className="truncate" title={performedBy}>{performedBy}</span>
        </div>
      );
    }

    if (status === "disqualified") {
      return (
        <div className="flex items-center gap-2 text-[12px] text-black">
          <UserX className="w-3.5 h-3.5 text-red-600" />
          <span className="truncate" title={performedBy}>{performedBy}</span>
        </div>
      );
    }

    return null;
  };

  const getAccountStatusSection = () => {
    if (!guard.account_status) return null;

    const rawStatus = String(guard.account_status).toLowerCase().trim();

    let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
    let dotClass = "bg-slate-400";
    let label = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

    if (rawStatus === "active") {
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      dotClass = "bg-emerald-500";
      label = "Active";
    } else if (rawStatus === "inactive") {
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
      dotClass = "bg-amber-500";
      label = "Inactive";
    } else if (rawStatus === "blocked") {
      badgeClass = "bg-red-50 text-red-700 border-red-200";
      dotClass = "bg-red-500";
      label = "Blocked";
    } else if (rawStatus === "archived") {
      badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
      dotClass = "bg-slate-500";
      label = "Archived";
    }

    return (
      <div className="flex items-center gap-2 text-[12px] pt-0.5">
        <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          {label}
        </span>
      </div>
    );
  };

  const handleCardClick = () => {
    if (guard.id) {
      router.push(`/guard-bank/${guard.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-slate-300"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (guard.id) onDelete?.(guard.id);
        }}
        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-md transition-colors cursor-pointer z-10"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-400 overflow-hidden">
          <User className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 flex-1 pr-8">
          <h4 className="font-bold text-slate-800 text-[15px]">
            {fullName}
          </h4>

          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-[#0064cb]" />
            <span className="font-bold text-[#0064cb]">{city || "-"}</span>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-[#0064cb]" />
            <span className="font-bold text-[#0064cb]">{locationText}</span>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-black">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate" title={email}>{email}</span>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-black">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{phoneNumber}</span>
          </div>

          {getPerformedBySection()}
          {getAccountStatusSection()}
        </div>
      </div>
    </div>
  );
}
