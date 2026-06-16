"use client";

import React, { useState, useCallback } from "react";
import {
  Database,
  Cloud,
  Cpu,
  ListTodo,
  Flame,
  Mail,
  Map,
  Video,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchSystemHealthAction, SystemHealthResponse } from "@/actions/system-health.actions";
import { cn } from "@/lib/utils";

interface ServiceLogsClientProps {
  initialData: SystemHealthResponse | null;
}

const SERVICES_META = [
  {
    key: "supabase_database",
    name: "Supabase Database",
    description: "Database cluster",
    icon: Database,
  },
  {
    key: "supabase_storage",
    name: "Supabase Storage",
    description: "Object storage",
    icon: Cloud,
  },
  {
    key: "redis",
    name: "Redis",
    description: "Cache store",
    icon: Cpu,
  },
  {
    key: "redis-celery",
    name: "Redis Celery",
    description: "Task queue",
    icon: ListTodo,
  },
  {
    key: "firebase",
    name: "Firebase",
    description: "Auth & Messaging",
    icon: Flame,
  },
  {
    key: "smtp",
    name: "SMTP",
    description: "Email relay",
    icon: Mail,
  },
  {
    key: "google_maps",
    name: "Google Maps",
    description: "Location APIs",
    icon: Map,
  },
  {
    key: "zegocloud",
    name: "Zegocloud",
    description: "RTC & Video",
    icon: Video,
  },
];

export default function ServiceLogsClient({ initialData }: ServiceLogsClientProps) {
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Modal State for inspecting failed service errors
  const [activeError, setActiveError] = useState<{ serviceName: string; errorText: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Core manual refresh function
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchSystemHealthAction();
      if (res.success && res.data) {
        setHealthData(res.data);
        setLastUpdated(new Date());
        toast.success("Health status updated successfully!");
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("An error occurred while fetching system health");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCopyError = () => {
    if (!activeError) return;
    navigator.clipboard.writeText(activeError.errorText);
    setCopied(true);
    toast.success("Error logs copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isAllOperational = healthData?.overall_status === "healthy";

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-montserrat mb-0 flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#0064cb]" />
            Service Status
          </h1>
          <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
            Monitor real-time status of core system services and third-party integrations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            size="sm"
            className="h-9 px-4 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-lg flex items-center gap-1.5 font-bold cursor-pointer transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            {isLoading ? "Refreshing..." : "Refresh Status"}
          </Button>
        </div>
      </div>

      {/* OVERALL HEALTH HERO CARD */}
      <Card
        className={cn(
          "w-full border-2 transition-all duration-300 shadow-sm",
          isAllOperational
            ? "border-emerald-200/80 bg-emerald-50/10"
            : "border-rose-200/80 bg-rose-50/10"
        )}
      >
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "p-3 rounded-full flex items-center justify-center shadow-inner",
                isAllOperational ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700 animate-pulse"
              )}
            >
              {isAllOperational ? (
                <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
              ) : (
                <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isAllOperational ? "All Systems Operational" : "Service Incident Detected"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isAllOperational
                  ? "All database, queue, cache, and third-party API services are responding within healthy parameters."
                  : "One or more core components are reporting outages. Click the 'View Error' button on the failed cards below."}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block shrink-0">
            <p className="text-[11px] font-semibold text-slate-400">LAST CHECK</p>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SERVICES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SERVICES_META.map((meta) => {
          const serviceData = healthData?.services?.[meta.key];
          const status = serviceData?.status || "healthy";
          const errorMsg = serviceData?.error;

          const isHealthy = status === "healthy";
          const isFailed = status === "failed" || status === "unhealthy";

          return (
            <Card
              key={meta.key}
              className={cn(
                "w-full border rounded-xl bg-white shadow-sm flex flex-col p-4 gap-4 justify-between transition-shadow hover:shadow-md",
                isFailed ? "border-rose-200/90" : "border-slate-200/90"
              )}
            >
              <div className="space-y-3">
                {/* Top Row: Icon & Status Badge */}
                <div className="flex items-center justify-between w-full">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                    <meta.icon className="h-5 w-5" />
                  </div>

                  {/* Status Badge */}
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-0.5 rounded border font-extrabold text-[10px] tracking-wider",
                      isHealthy
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200/50"
                        : "bg-rose-50 text-rose-600 border-rose-200/50"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isHealthy ? "bg-emerald-500" : "bg-rose-500"
                      )}
                    />
                    {status.toUpperCase()}
                  </div>
                </div>

                {/* Middle Row: Name & Description */}
                <div className="space-y-0.5">
                  <h4 className="text-[15px] font-bold text-slate-800 tracking-tight leading-snug">
                    {meta.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    {meta.description}
                  </p>
                </div>
              </div>

              {/* Bottom Action: Show error when failing */}
              {isFailed && (
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setActiveError({
                        serviceName: meta.name,
                        errorText: errorMsg || "No error details returned from system checks.",
                      })
                    }
                    className="w-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer h-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    View Error Details
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ERROR MODAL OVERLAY */}
      {activeError && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-200"
          onClick={() => setActiveError(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col max-h-[80vh] overflow-hidden select-text animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5 stroke-[2]" />
                <h3 className="text-base font-bold font-montserrat">
                  {activeError.serviceName} - Error Outage
                </h3>
              </div>
              <button
                onClick={() => setActiveError(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="rounded-lg bg-rose-50/50 border border-rose-100 p-3.5 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[12.5px] leading-relaxed text-rose-700 font-medium">
                  The health check for this service failed. Review the stack trace below for diagnostic details.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  System Diagnostics
                </span>
                <pre className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-200 text-xs font-mono break-all whitespace-pre-wrap max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 select-text leading-relaxed">
                  {activeError.errorText}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-100 bg-slate-50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyError}
                className="h-9 px-3 rounded-lg border-slate-200 text-slate-600 hover:text-slate-800 flex items-center gap-1.5 font-semibold text-xs cursor-pointer bg-white"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    Copy Error
                  </>
                )}
              </Button>
              <Button
                onClick={() => setActiveError(null)}
                size="sm"
                className="h-9 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
