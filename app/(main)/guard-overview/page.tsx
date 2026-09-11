"use client";

import {
  ShieldCheck,
  Clock,
  MapPin,
  Star,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function GuardOverviewPage() {
  const router = useRouter();
  const [backUrl, setBackUrl] = useState("/users-directory/guards");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    if (returnTo) {
      setBackUrl(returnTo);
    }
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1 mb-6">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Guard Overview</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(backUrl)} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Guard Overview</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Shifts Completed</p>
              <h3 className="text-3xl font-bold text-slate-900">48</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Late to Start</p>
              <h3 className="text-3xl font-bold text-slate-900">6</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Out of Geofence</p>
              <h3 className="text-3xl font-bold text-slate-900">3</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <div className="p-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Guard Reviews</h2>
        </div>

        <div className="p-6">
          <div className="border border-slate-100 rounded-xl p-6 flex flex-col md:flex-row gap-8 items-center bg-slate-50/50 mb-8">
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Overall Rating</h3>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-5xl font-bold text-slate-900 leading-none">4.7</span>
                <div className="flex pb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                  ))}
                  <div className="relative">
                    <Star className="w-6 h-6 text-slate-200 fill-slate-200" />
                    <div className="absolute inset-0 overflow-hidden w-[70%]">
                      <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Based on 18 reviews</p>
            </div>

            <div className="flex-[1.5] w-full max-w-md space-y-2">
              {[
                { stars: 5, count: 12, percent: 66 },
                { stars: 4, count: 4, percent: 22 },
                { stars: 3, count: 2, percent: 11 },
                { stars: 2, count: 0, percent: 0 },
                { stars: 1, count: 0, percent: 0 },
              ].map((row) => (
                <div key={row.stars} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  <div className="w-6 flex items-center gap-1 justify-end">
                    {row.stars} <Star className="w-3 h-3 fill-slate-700" />
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <div className="w-4 text-right text-slate-500 font-medium">{row.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-6 border-b border-slate-100 mb-6">
            <button className="pb-3 text-sm font-bold text-[#0064cb] border-b-2 border-[#0064cb]">
              All Reviews (18)
            </button>
            <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">
              Customer Reviews (12)
            </button>
            <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">
              FastGuard Reviews (6)
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 pb-6 border-b border-slate-100">
              <div className="md:w-44 shrink-0">
                <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">
                  CUSTOMER REVIEW
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-800 font-medium mb-4">
                  Excellent service overall. The security team was professional, on time and handled everything very well.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Solidcore
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Aug 31, 2026
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> 8:30 PM - 6:30 AM
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between shrink-0 md:w-32">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-4 md:mb-0">
                  <Calendar className="w-3.5 h-3.5" /> Aug 31, 2026
                </div>
                <Link href="#" className="text-xs font-bold text-[#0064cb] hover:underline flex items-center whitespace-nowrap">
                  View Shift Report <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6 pb-6 border-b border-slate-100">
              <div className="md:w-44 shrink-0">
                <span className="inline-block px-2.5 py-1 bg-blue-100 text-[#0064cb] text-[10px] font-bold rounded uppercase tracking-wider">
                  FASTGUARD REVIEW
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex mb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <Star className="w-4 h-4 text-slate-200 fill-slate-200" />
                </div>
                <p className="text-sm text-slate-800 font-medium mb-4">
                  Good performance. Followed instructions well and maintained proper site control.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Reviewed by: Admin
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Aug 30, 2026
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Shift #11230
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between shrink-0 md:w-32">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-4 md:mb-0">
                  <Calendar className="w-3.5 h-3.5" /> Aug 30, 2026
                </div>
                <Link href="#" className="text-xs font-bold text-[#0064cb] hover:underline flex items-center whitespace-nowrap">
                  View Shift Report <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6 pb-2">
              <div className="md:w-44 shrink-0">
                <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">
                  CUSTOMER REVIEW
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-800 font-medium mb-4">
                  Guard was polite and attentive. Great communication throughout the shift.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Acme Construction
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Aug 28, 2026
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> 7:00 AM - 3:00 PM
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between shrink-0 md:w-32">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-4 md:mb-0">
                  <Calendar className="w-3.5 h-3.5" /> Aug 28, 2026
                </div>
                <Link href="#" className="text-xs font-bold text-[#0064cb] hover:underline flex items-center whitespace-nowrap">
                  View Shift Report <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </Card>
    </div>
  );
}
