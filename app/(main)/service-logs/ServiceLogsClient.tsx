"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  Check,
  Briefcase,
  Key
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchSystemHealthAction, SystemHealthResponse } from "@/actions/system-health.actions";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink } from "lucide-react";
import { getTokenDataAction, generateTokenAction } from "@/actions/zoho.actions";

interface ServiceLogsClientProps {
  initialData: SystemHealthResponse | null;
}

const SERVICE_INFO: Record<string, { name: string; description: string; icon: any }> = {
  zoho: {
    name: "Zoho",
    description: "CRM Integration",
    icon: Briefcase,
  },
  supabase_database: {
    name: "Supabase Database",
    description: "Database cluster",
    icon: Database,
  },
  supabase_storage: {
    name: "Supabase Storage",
    description: "Object storage",
    icon: Cloud,
  },
  redis: {
    name: "Redis",
    description: "Cache store",
    icon: Cpu,
  },
  "redis-celery": {
    name: "Redis Celery",
    description: "Task queue",
    icon: ListTodo,
  },
  firebase: {
    name: "Firebase",
    description: "Auth & Messaging",
    icon: Flame,
  },
  smtp: {
    name: "SMTP",
    description: "Email relay",
    icon: Mail,
  },
  google_maps: {
    name: "Google Maps",
    description: "Location APIs",
    icon: Map,
  },
  zegocloud: {
    name: "Zegocloud",
    description: "RTC & Video",
    icon: Video,
  },
};

const ZOHO_SCOPES = `ZohoCRM.send_mail.all.CREATE,ZohoCRM.modules.ALL,ZohoCRM.Files.READ,ZohoCRM.files.CREATE,ZohoCRM.modules.leads.READ,ZohoCRM.modules.emails.READ,ZohoCRM.modules.leads.CREATE,ZohoCRM.notifications.All,ZohoCRM.settings.all,ZohoCRM.users.all,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL,ZohoCRM.bulk.ALL,ZohoCRM.modules.emails.ALL,ZohoCRM.settings.signals.ALL,ZohoCRM.signals.ALL, ZohoMeeting.meeting.CREATE,ZohoBooks.customerpayments.CREATE,ZohoCRM.modules.ALL,ZohoBooks.contacts.READ, ZohoBooks.fullaccess.all,ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL,ZohoCRM.bulk.ALL,ZohoBooks.contacts.CREATE,ZohoCRM.modules.ALL,ZohoBooks.estimates.READ,ZohoBooks.estimates.CREATE,ZohoCRM.modules.leads.CREATE,ZohoMail.messages.CREATE,ZohoCRM.send_mail.all.CREATE`;

function ServiceLogsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-96 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="w-full h-[104px] bg-slate-200 rounded-xl"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-full h-[112px] bg-slate-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

export default function ServiceLogsClient({ initialData }: ServiceLogsClientProps) {
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Modal State for inspecting failed service errors
  const [activeError, setActiveError] = useState<{ serviceName: string; errorText: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Zoho Token Generation State
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingTokenData, setIsFetchingTokenData] = useState(false);

  // Core manual refresh function
  const handleRefresh = useCallback(async (isInitial = false) => {
    setIsLoading(true);
    try {
      const res = await fetchSystemHealthAction();
      if (res.success && res.data) {
        setHealthData(res.data);
        setLastUpdated(new Date());
        if (!isInitial) toast.success("Health status updated successfully!");
      } else {
        if (!isInitial) toast.error(res.error || "Failed to update status");
      }
    } catch {
      if (!isInitial) toast.error("An error occurred while fetching system health");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!healthData) {
      handleRefresh(true);
    }
  }, [healthData, handleRefresh]);

  const handleCopyError = async () => {
    if (!activeError) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeError.errorText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = activeError.errorText;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success("Error logs copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleOpenTokenDialog = async () => {
    setIsTokenDialogOpen(true);
    setShowInstructions(false);
    setIsFetchingTokenData(true);
    try {
      const res = await getTokenDataAction();
      if (res.success && res.data) {
        setClientId(res.data.client_id || "");
        setClientSecret(res.data.client_secret || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingTokenData(false);
    }
  };

  const handleGenerateTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !clientSecret || !authCode) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateTokenAction({
        clientId,
        clientSecret,
        authorizationCode: authCode
      });
      if (res.success) {
        toast.success(res.message || "Token generated successfully!");
        setIsTokenDialogOpen(false);
        setAuthCode("");
        handleRefresh(false);
      } else {
        toast.error(res.error || "Failed to generate token");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!healthData) {
    return <ServiceLogsSkeleton />;
  }

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
            onClick={() => handleRefresh(false)}
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
        {Object.entries(healthData?.services || {}).map(([key, serviceData]) => {
          const status = serviceData?.status || "healthy";
          const errorMsg = serviceData?.error;

          const isHealthy = status === "healthy";
          const isFailed = status === "failed" || status === "unhealthy";

          const meta = SERVICE_INFO[key] || {
            name: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            description: "System Service",
            icon: Activity
          };

          return (
            <Card
              key={key}
              className={cn(
                "w-full border-2 rounded-xl bg-white shadow-sm flex flex-col p-4 gap-4 justify-between transition-shadow hover:shadow-md",
                isFailed ? "border-rose-500/80" : "border-slate-200/90 border"
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
                <div className="flex flex-row items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-[15px] font-bold text-slate-800 tracking-tight leading-snug">
                      {meta.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      {meta.description}
                    </p>
                  </div>

                  {key === "zoho" && isFailed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenTokenDialog}
                      className="h-8 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer rounded-lg border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                    >
                      <Key className="h-3.5 w-3.5" />
                      Generate Token
                    </Button>
                  )}
                </div>
              </div>

              {/* Bottom Action: Show error when failing */}
              {isFailed && key !== "zoho" && (
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

      {/* ZOHO TOKEN MODALS */}
      <Dialog
        open={isTokenDialogOpen}
        onOpenChange={(open) => {
          setIsTokenDialogOpen(open);
          if (!open) setShowInstructions(false);
        }}
      >
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-white">
            <DialogTitle className="text-xl">Generate Zoho Token</DialogTitle>
            <DialogDescription className="mt-1">
              Provide your API credentials and the newly generated authorization code to authenticate with Zoho.
            </DialogDescription>
          </div>

          {isFetchingTokenData ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#0064cb]" />
              <p className="text-sm text-slate-500 font-medium">Fetching existing credentials...</p>
            </div>
          ) : (
            <div className="p-6 bg-white overflow-y-auto max-h-[80vh]">
              <form onSubmit={handleGenerateTokenSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="Enter Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    placeholder="Enter Client Secret"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    required
                    className="bg-slate-50"
                  />
                </div>

                <div className="pt-1">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="px-0 text-[#0064cb] font-semibold h-auto py-0 flex items-center gap-1.5"
                  >
                    Instructions to generate authorization code
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {showInstructions && (
                  <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-100 mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="text-[13px] text-slate-700 space-y-3">
                      <ol className="list-decimal list-outside ml-4 space-y-3">
                        <li>
                          Click the link below to open the Zoho API Console:
                          <br />
                          <a
                            href={`https://api-console.zoho.com/client/${clientId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0064cb] font-medium hover:underline break-all mt-1.5 inline-flex items-center gap-1 bg-blue-50 p-1.5 rounded-md border border-blue-100 w-full"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{`https://api-console.zoho.com/client/${clientId || "[YOUR_CLIENT_ID]"}`}</span>
                          </a>
                        </li>
                        <li>Click on <strong>Self Client</strong>.</li>
                        <li>
                          In the Generate Code section, enter the following:
                          <div className="mt-2 space-y-3 p-3 bg-white rounded-md border border-slate-200 text-xs shadow-sm">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <strong>Scopes:</strong>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(ZOHO_SCOPES);
                                    toast.success("Scopes copied to clipboard!");
                                  }}
                                  className="text-slate-400 hover:text-[#0064cb] transition-colors p-1 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded flex items-center justify-center"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="cursor-pointer h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 max-h-28 overflow-y-auto">
                                <pre className="text-[11px] font-mono whitespace-pre-wrap break-all text-slate-600 leading-snug">
                                  {ZOHO_SCOPES}
                                </pre>
                              </div>
                            </div>
                            <div className="pt-1 space-y-1.5 border-t border-slate-100">
                              <p><strong>Time Duration:</strong> 10 minutes</p>
                              <p><strong>Scope Description:</strong> Provide any text description</p>
                            </div>
                          </div>
                        </li>
                        <li>Click <strong>Create</strong>.</li>
                        <li>Copy the <strong>AUTHORIZATION CODE</strong> generated by Zoho.</li>
                        <li>Paste the code into the input field below.</li>
                        <li>Click <strong>Generate Token</strong> to complete authentication.</li>
                      </ol>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Label htmlFor="authCode">Authorization Code</Label>
                  <Input
                    id="authCode"
                    placeholder="Enter Authorization Code from Zoho"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    required
                    className="bg-slate-50 border-[#0064cb]/30 focus-visible:ring-[#0064cb]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsTokenDialogOpen(false)}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="bg-[#0064cb] hover:bg-[#0052ae] text-white"
                  >
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isGenerating ? "Generating..." : "Generate Token"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
