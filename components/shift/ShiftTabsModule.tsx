import { useState, useEffect } from "react";
import { ChevronRight, MessageSquarePlus, FileText, ClipboardList, MapPin, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ShiftCommentsTab } from "./tabs/ShiftCommentsTab";
import { ShiftDARReportTab } from "./tabs/ShiftDARReportTab";
import { ShiftIncidentReportsTab } from "./tabs/ShiftIncidentReportsTab";
import { ShiftCheckpointsTab } from "./tabs/ShiftCheckpointsTab";
import { ShiftHistoryTab } from "./tabs/ShiftHistoryTab";
import { ShiftExtensionRequestsTab } from "./tabs/ShiftExtensionRequestsTab";
import { Comment, ShiftReports, PreviewFile, ShiftExtensionRequest } from "./types";

interface ShiftTabsModuleProps {
  comments: Comment[];
  isCommentsLoading: boolean;
  commentsError: string | null;
  onCommentSubmit: (text: string, type: "internal" | "external", file: File | null, recipient?: string) => Promise<boolean>;

  reports: ShiftReports | null;
  isReportsLoading: boolean;
  reportsError: string | null;
  onTabChange?: (tabId: string) => void;

  setPreviewFile: (file: PreviewFile | null) => void;
  securityServiceId?: string | null;
  isLoading?: boolean;
  hasLeadGuard?: boolean;
  hasStandbyGuard?: boolean;
  leadGuardStatus?: string;
  standbyGuardStatus?: string;
  timezone?: string;
  shiftExtensionRequests?: ShiftExtensionRequest[];
  shiftId: string;
  onRefresh?: () => void;
}

export function ShiftTabsModule({
  comments,
  isCommentsLoading,
  commentsError,
  onCommentSubmit,
  reports,
  isReportsLoading,
  reportsError,
  onTabChange,
  setPreviewFile,
  securityServiceId,
  isLoading,
  hasLeadGuard = false,
  hasStandbyGuard = false,
  leadGuardStatus,
  standbyGuardStatus,
  timezone,
  shiftExtensionRequests = [],
  shiftId,
  onRefresh,
}: ShiftTabsModuleProps) {
  const [activeTab, setActiveTab] = useState("");

  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-xl overflow-hidden rounded-[1.5rem] bg-white border-none animate-pulse">
        <CardContent className="p-0">
          <div className="flex flex-col">
            {[...Array(5)].map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-5 border-b border-slate-55 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  <div className="h-3 bg-slate-200 rounded w-36" />
                </div>
                <div className="w-4 h-4 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    {
      id: "extension",
      label: "Shift Extend Requests",
      icon: FileText,
      badge: shiftExtensionRequests.filter((r) => r.status === "pending").length || undefined,
      badgeColor: "bg-[#dc2626]"
    },
    { id: "comment", label: "Add Comment", icon: MessageSquarePlus },
    {
      id: "dar",
      label: securityServiceId === "38ade601-2dc3-4fc8-ac0e-90cf99f2a045"
        ? "Firewatch Log Report"
        : "Daily Activity Report",
      icon: FileText
    },
    { id: "report", label: "Incident Report", icon: ClipboardList },
    { id: "checkpoint", label: "Check Point", icon: MapPin },
    { id: "history", label: "History of changes", icon: History },
  ];

  return (
    <Card className="border-slate-200 shadow-xl overflow-hidden rounded-[1.5rem] bg-white border-none">
      <CardContent className="p-0">
        <div className="flex flex-col">
          {tabs.map((tab) => {
            const hasError = tab.badge !== undefined && tab.badge > 0;
            return (
              <div key={tab.id} className="border-b border-slate-55 last:border-0">
                <button
                  onClick={() => {
                    const nextTab = activeTab === tab.id ? "" : tab.id;
                    setActiveTab(nextTab);
                    if (nextTab && onTabChange) {
                      onTabChange(nextTab);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-5 transition-all cursor-pointer border-none bg-transparent focus:outline-none text-left",
                    activeTab === tab.id
                      ? (hasError ? "bg-red-50 text-red-600 hover:bg-red-100/50" : "bg-blue-50 text-[#0064cb] hover:bg-blue-100/50")
                      : (hasError ? "text-red-600 bg-red-50/30 hover:bg-red-50/80" : "text-slate-600 hover:bg-slate-55/80")
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        activeTab === tab.id
                          ? (hasError ? "bg-red-100" : "bg-blue-100/50")
                          : (hasError ? "bg-red-100/50" : "bg-slate-100")
                      )}
                    >
                      <tab.icon className={cn("w-4 h-4", hasError && "text-red-600")} />
                    </div>
                    <span className="text-xs font-bold tracking-tight uppercase">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={cn("ml-2 px-2 py-0.5 text-[10px] font-bold text-white rounded-full", tab.badgeColor || "bg-blue-500")}>
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      activeTab === tab.id
                        ? (hasError ? "rotate-90 text-red-600" : "rotate-90 text-[#0064cb]")
                        : (hasError ? "text-red-400" : "text-slate-300")
                    )}
                  />
                </button>

                {activeTab === tab.id && (
                  <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                    {tab.id === "extension" && (
                      <ShiftExtensionRequestsTab
                        requests={shiftExtensionRequests}
                        shiftId={shiftId}
                        timezone={timezone}
                        onRefresh={onRefresh}
                      />
                    )}
                    {tab.id === "comment" && (
                      <ShiftCommentsTab
                        comments={comments}
                        isCommentsLoading={isCommentsLoading}
                        commentsError={commentsError}
                        onCommentSubmit={onCommentSubmit}
                        setPreviewFile={setPreviewFile}
                        hasLeadGuard={hasLeadGuard}
                        hasStandbyGuard={hasStandbyGuard}
                        leadGuardStatus={leadGuardStatus}
                        standbyGuardStatus={standbyGuardStatus}
                        timezone={timezone}
                      />
                    )}
                    {tab.id === "dar" && (
                      <ShiftDARReportTab
                        reports={reports}
                        isReportsLoading={isReportsLoading}
                        reportsError={reportsError}
                        setPreviewFile={setPreviewFile}
                        securityServiceId={securityServiceId}
                      />
                    )}
                    {tab.id === "report" && (
                      <ShiftIncidentReportsTab
                        reports={reports}
                        isReportsLoading={isReportsLoading}
                        reportsError={reportsError}
                        setPreviewFile={setPreviewFile}
                        timezone={timezone}
                      />
                    )}
                    {tab.id === "checkpoint" && (
                      <ShiftCheckpointsTab
                        reports={reports}
                        isReportsLoading={isReportsLoading}
                        reportsError={reportsError}
                        setPreviewFile={setPreviewFile}
                        timezone={timezone}
                      />
                    )}
                    {tab.id === "history" && (
                      <ShiftHistoryTab
                        reports={reports}
                        isReportsLoading={isReportsLoading}
                        reportsError={reportsError}
                        setPreviewFile={setPreviewFile}
                        timezone={timezone}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
