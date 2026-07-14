"use client";

import { useRouter } from "next/navigation";
import { Trash2, User, Building2, MapPin, Mail, Phone, Eye, UserCheck, UserX } from "lucide-react";

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
  };
  status: "record_touched" | "approved" | "disqualified";
  onDelete?: (id: string) => void;
}

export function GuardCard({ guard, status, onDelete }: GuardCardProps) {
  const router = useRouter();

  const getPerformedBySection = () => {
    if (!guard.performed_by) return null;

    if (status === "record_touched") {
      return (
        <div className="flex items-center gap-2 text-[12px] text-black">
          <Eye className="w-3.5 h-3.5 text-teal-600" />
          <span className="truncate" title={guard.performed_by}>{guard.performed_by}</span>
        </div>
      );
    }

    if (status === "approved") {
      return (
        <div className="flex items-center gap-2 text-[12px] text-black">
          <UserCheck className="w-3.5 h-3.5 text-green-600" />
          <span className="truncate" title={guard.performed_by}>{guard.performed_by}</span>
        </div>
      );
    }

    if (status === "disqualified") {
      return (
        <div className="flex items-center gap-2 text-[12px] text-black">
          <UserX className="w-3.5 h-3.5 text-red-600" />
          <span className="truncate" title={guard.performed_by}>{guard.performed_by}</span>
        </div>
      );
    }

    return null;
  };

  const handleCardClick = () => {
    router.push(`/guard-bank/${guard.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-slate-300"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(guard.id);
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
            {`${guard.first_name || ""} ${guard.last_name || ""}`.trim()}
          </h4>

          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-[#0064cb]" />
            <span className="font-bold text-[#0064cb]">{guard.city}</span>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-[#0064cb]" />
            <span className="font-bold text-[#0064cb]">{guard.state}, {guard.country}</span>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-black">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate" title={guard.email}>{guard.email}</span>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-black">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{guard.phone_number}</span>
          </div>

          {getPerformedBySection()}
        </div>
      </div>
    </div>
  );
}
