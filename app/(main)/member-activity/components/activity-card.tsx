"use client";

import { User, Building2, MapPin, Mail, Phone, Eye, UserCheck, UserX, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActivityCardProps {
  activity: {
    id: string;
    first_name?: string;
    last_name?: string;
    city?: string;
    state?: string;
    country?: string;
    email?: string;
    phone_number?: string;
    status: "record_touched" | "approved" | "disqualified" | "pending";
    performed_by?: string | null;
    performed_on?: string | null;
    created_at?: string | null;
  };
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    // Attempt to route to guard-bank using the activity id (which usually matches the guard/user id in this context)
    // If the API returns a specific guard_id, we can fall back to it if added to the type later.
    const targetId = (activity as any).guard_id || (activity as any).user_id || activity.id;
    router.push(`/guard-bank/${targetId}`);
  };

  const getStatusBadge = () => {
    switch (activity.status) {
      case "record_touched":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-bold shadow-sm">
            <Eye className="w-3.5 h-3.5" />
            <span>Record Touched</span>
          </div>
        );
      case "approved":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold shadow-sm">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Approved</span>
          </div>
        );
      case "disqualified":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold shadow-sm">
            <UserX className="w-3.5 h-3.5" />
            <span>Disqualified</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold shadow-sm">
            <span className="capitalize">{activity.status}</span>
          </div>
        );
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-slate-300"
    >
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-400 overflow-hidden shadow-inner">
          <User className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 flex-1 pr-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-slate-800 text-[15px] truncate">
              {`${activity.first_name || ""} ${activity.last_name || ""}`.trim() || "Unknown Guard"}
            </h4>
            <div className="shrink-0">{getStatusBadge()}</div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {activity.city && (
              <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-[#0064cb]" />
                <span className="font-bold text-[#0064cb]">{activity.city}</span>
              </div>
            )}
            {(activity.state || activity.country) && (
              <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-[#0064cb]" />
                <span className="font-bold text-[#0064cb] truncate max-w-[120px]">
                  {[activity.state, activity.country].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-100">
            {activity.email && (
              <div className="flex items-center gap-2 text-[12px] text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate" title={activity.email}>{activity.email}</span>
              </div>
            )}

            {activity.phone_number && (
              <div className="flex items-center gap-2 text-[12px] text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{activity.phone_number}</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
