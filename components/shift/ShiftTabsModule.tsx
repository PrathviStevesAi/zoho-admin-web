import { useState, useEffect } from "react";
import { ChevronRight, MessageSquarePlus, FileText, ClipboardList, MapPin, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ShiftCommentsTab } from "./tabs/ShiftCommentsTab";
import { ShiftDARReportTab } from "./tabs/ShiftDARReportTab";
import { ShiftIncidentReportsTab } from "./tabs/ShiftIncidentReportsTab";
import { ShiftCheckpointsTab } from "./tabs/ShiftCheckpointsTab";
import { ShiftHistoryTab } from "./tabs/ShiftHistoryTab";
import { Comment, ShiftReports, PreviewFile } from "./types";

interface ShiftTabsModuleProps {
  comments: Comment[];
  isCommentsLoading: boolean;
  commentsError: string | null;
  onCommentSubmit: (text: string, type: "internal" | "external", file: File | null) => Promise<boolean>;

  reports: ShiftReports | null;
  isReportsLoading: boolean;
  reportsError: string | null;
  onTabChange?: (tabId: string) => void;

  setPreviewFile: (file: PreviewFile | null) => void;
  securityServiceId?: string | null;
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
}: ShiftTabsModuleProps) {
  const [activeTab, setActiveTab] = useState("");

  const tabs = [
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
          {tabs.map((tab) => (
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
                  "w-full flex items-center justify-between p-5 transition-all hover:bg-slate-55/80 cursor-pointer border-none bg-transparent focus:outline-none text-left",
                  activeTab === tab.id ? "bg-blue-50 text-[#0064cb]" : "text-slate-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      activeTab === tab.id ? "bg-blue-100/50" : "bg-slate-100"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-tight uppercase">{tab.label}</span>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    activeTab === tab.id ? "rotate-90 text-[#0064cb]" : "text-slate-300"
                  )}
                />
              </button>

              {activeTab === tab.id && (
                <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                  {tab.id === "comment" && (
                    <ShiftCommentsTab
                      comments={comments}
                      isCommentsLoading={isCommentsLoading}
                      commentsError={commentsError}
                      onCommentSubmit={onCommentSubmit}
                      setPreviewFile={setPreviewFile}
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
                    />
                  )}
                  {tab.id === "checkpoint" && (
                    <ShiftCheckpointsTab
                      reports={reports}
                      isReportsLoading={isReportsLoading}
                      reportsError={reportsError}
                      setPreviewFile={setPreviewFile}
                    />
                  )}
                  {tab.id === "history" && (
                    <ShiftHistoryTab
                      reports={reports}
                      isReportsLoading={isReportsLoading}
                      reportsError={reportsError}
                      setPreviewFile={setPreviewFile}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
