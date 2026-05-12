"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  RefreshCcw,
  Calendar,
  Search,
  UserPlus,
  ExternalLink,
  XCircle,
  Edit2,
  MessageSquarePlus,
  FileText,
  ClipboardList,
  MapPin,
  History,
  Paperclip,
  Download,
  Maximize2,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchShiftDetailsAction } from "@/actions/dashboard.actions";
import { toast } from "sonner";

function NotificationViewContent() {
  const searchParams = useSearchParams();
  const shiftId = searchParams.get("shift_id");
  const [shift, setShift] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [showFilePreview, setShowFilePreview] = useState(false);

  const loadShiftDetails = useCallback(async () => {
    if (!shiftId) return;
    setIsLoading(true);
    const res = await fetchShiftDetailsAction(shiftId);
    if (res.success) {
      setShift(res.data);
    }
    setIsLoading(false);
  }, [shiftId]);

  useEffect(() => {
    loadShiftDetails();
  }, [loadShiftDetails]);

  const formatDescription = (text: string) => {
    if (!text) return null;
    const sections = text.split('*').map(s => s.trim()).filter(Boolean);
    return (
      <div className="space-y-3">
        {sections.map((section, idx) => {
          if (section.includes('PM') || section.includes('AM')) {
            return (
              <div key={idx} className="flex items-start gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span className="text-slate-200">{section}</span>
              </div>
            );
          }
          const lines = section.split(/(?=[A-Z][a-z]+ [a-z]*:)|(?=Total [A-Z][a-z]+:)/g);
          return (
            <div key={idx} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                const parts = line.split(':');
                if (parts.length > 1) {
                  return (
                    <div key={lIdx} className="flex justify-between gap-4 border-b border-slate-800/50 pb-1 last:border-0">
                      <span className="text-slate-400 font-medium whitespace-nowrap">{parts[0].trim()}:</span>
                      <span className="text-slate-200 text-right">{parts.slice(1).join(':').trim()}</span>
                    </div>
                  );
                }
                return <p key={lIdx} className="text-slate-200">{line.trim()}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'shift_planned': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shift_accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'shift_in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'shift_finished': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'shift_approved': return 'bg-sky-100 text-sky-700 border-sky-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'N/A';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAssignGuard = () => {
    if (!shift) return;
    const paymentStatus = shift.payment_status?.toLowerCase();
    if (paymentStatus === 'pending' || paymentStatus === 'unpaid') {
      toast.error("The payment status should be Paid or Net term client to assign the shift to Guard.", {
        duration: 5000,
      });
      return;
    }
    // Logic for successful assignment redirection or action can go here
    toast.info("Proceeding to assign guard...");
  };

  const getStepStatus = (stepName: string) => {
    if (!shift) return "upcoming";
    const statusOrder = [
      "shift_planned",
      "shift_accepted",
      "shift_in_progress",
      "shift_finished",
      "shift_approved"
    ];

    const currentStatus = shift.status;
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const tabs = [
    { id: "comment", label: "Add Comment", icon: MessageSquarePlus },
    { id: "dar", label: "DAR Report", icon: FileText },
    { id: "report", label: "Report", icon: ClipboardList },
    { id: "checkpoint", label: "Check Point", icon: MapPin },
    { id: "history", label: "History of changes", icon: History },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-[13px] mb-1">
              <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/notifications" className="hover:text-[#0064cb] transition-colors">Notifications</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/notifications" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-[#0064cb] transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="group relative">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 cursor-default">
                  {shift ? (
                    <>
                      <span className="hover:text-[#0064cb] transition-colors">{shift.customer_name}</span>
                      <span className="text-slate-400 font-normal ml-1">[ #SH-{shift.shift_no} ]</span>
                    </>
                  ) : "Loading..."}
                </h1>

                {shift?.invoice_description && (
                  <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-900 text-white text-[11px] rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[70] border border-slate-800 shadow-blue-900/20">
                    <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-800" />
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                      <p className="font-bold text-blue-400">Shift Description</p>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                      {formatDescription(shift.invoice_description)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-4">
          {[
            { label: "Update Status", icon: RefreshCcw, color: "emerald", onClick: () => {} },
            { label: "Schedule Shift", icon: Calendar, color: "blue", onClick: () => {} },
            { label: "Find Available Guard", icon: Search, color: "orange", onClick: () => {} },
            { label: "Assign Guard", icon: UserPlus, color: "indigo", onClick: handleAssignGuard },
            { label: "Open in CRM", icon: ExternalLink, color: "slate", onClick: () => {} },
            { label: "Cancel Service", icon: XCircle, color: "red", onClick: () => {} },
          ].map((action, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={action.onClick}>
              <div className={cn(
                "w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors",
                action.color === "emerald" && "border-emerald-500 text-emerald-500 group-hover:bg-emerald-50",
                action.color === "blue" && "border-[#0064cb] text-[#0064cb] group-hover:bg-blue-50",
                action.color === "orange" && "border-orange-500 text-orange-500 group-hover:bg-orange-50",
                action.color === "indigo" && "border-indigo-500 text-indigo-500 group-hover:bg-indigo-50",
                action.color === "slate" && "border-slate-400 text-slate-500 group-hover:bg-slate-50",
                action.color === "red" && "border-red-400 text-red-500 group-hover:bg-red-50",
              )}>
                <action.icon className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase text-center leading-[1.2] tracking-tight">{action.label.split(' ').join('\n')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Card - Decreased width to 7/12 */}
        <div className="lg:col-span-7 space-y-6">
          {isLoading ? (
            <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#0064cb]" />
              <p className="text-sm font-medium text-slate-400">Fetching shift details...</p>
            </Card>
          ) : shift ? (
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white">
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-700">#SH-{shift.shift_no}</span>
                    <Button
                      variant="outline"
                      className="h-8 rounded-lg font-bold text-[10px] text-[#0064cb] border-[#0064cb]/20 hover:bg-blue-50 transition-all active:scale-95 flex gap-1.5 cursor-pointer px-3"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit Details
                    </Button>
                  </div>

                  <p className="text-slate-600 font-bold text-sm">
                    Location - <span className="text-[#0064cb] cursor-pointer hover:underline">
                      {shift.shipping_location?.location?.street}, {shift.shipping_location?.location?.address}, {shift.shipping_location?.location?.city}, {shift.shipping_location?.location?.state}, {shift.shipping_location?.location?.country} - {shift.shipping_location?.location?.zip}
                    </span>
                  </p>
                </div>

                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  <div className="grid grid-cols-4 p-4 items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">CUSTOMER NAME:</span>
                    <div className="col-span-3 text-sm text-slate-500 font-medium">{shift.customer_name}</div>
                  </div>

                  <div className="grid grid-cols-4 p-4 items-start">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight pt-1">DESCRIPTION:</span>
                    <div className="col-span-3 text-sm text-slate-500 font-medium whitespace-pre-wrap leading-relaxed">
                      {shift.invoice_description}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 p-4 items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">ASSIGNED GUARD:</span>
                    <div className="col-span-3 text-sm text-slate-500 font-medium">
                      {shift.assigned_guard || (
                        <span className="text-slate-400">No guard assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 p-4 items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">STATUS:</span>
                    <div className="col-span-3">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                        getStatusColor(shift.status)
                      )}>
                        {formatStatus(shift.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 p-4 items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">SCHEDULED FOR:</span>
                    <div className="col-span-3 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 uppercase font-bold w-12">Start:</span>
                        <span className="text-sm text-slate-500 font-medium">{formatDateTime(shift.scheduled_for?.shift_start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 uppercase font-bold w-12">End:</span>
                        <span className="text-sm text-slate-500 font-medium">{formatDateTime(shift.scheduled_for?.shift_end_time)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-20 text-center">
              <XCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-400">No shift data found.</p>
            </Card>
          )}

          {/* Progress Stepper Section */}
          <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-8">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight mb-12">Progress</h3>

            <div className="relative px-4">
              {/* Progress Line */}
              <div className="absolute top-2 left-4 right-4 h-[2px] bg-slate-200" />

              <div className="flex justify-between items-start relative">
                {[
                  { label: "Shift Planned", status: getStepStatus("shift_planned") },
                  { label: "Shift Accepted", status: getStepStatus("shift_accepted") },
                  { label: "Shift In Progress", status: getStepStatus("shift_in_progress") },
                  { label: "Shift Finished", status: getStepStatus("shift_finished") },
                  { label: "Shift Approved", status: getStepStatus("shift_approved") },
                  { label: "Pre-shift Check-in completed", status: "upcoming" },
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    {/* Circle Indicator */}
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 bg-white relative z-10 transition-all duration-300",
                      step.status === "completed" && "border-[#7cb342] shadow-[0_0_0_3px_rgba(124,179,66,0.15)]",
                      step.status === "current" && "w-7 h-7 -mt-1.5 border-[#ffb300] shadow-[0_0_0_6px_rgba(255,179,0,0.2)] ring-4 ring-white",
                      step.status === "upcoming" && "border-slate-400"
                    )} />

                    {/* Label */}
                    <div className="mt-6 px-1">
                      <span className={cn(
                        "text-[11px] font-medium text-center block leading-snug transition-colors",
                        step.status === "completed" && "text-slate-600",
                        step.status === "current" && "text-slate-800 font-bold",
                        step.status === "upcoming" && "text-slate-400"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar with Vertical Tabs - Increased width to 5/12 */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-xl overflow-hidden rounded-[1.5rem] bg-white border-none">
            <CardContent className="p-0">
              <div className="flex flex-col">
                {tabs.map((tab) => (
                  <div key={tab.id} className="border-b border-slate-50 last:border-0">
                    <button
                      onClick={() => setActiveTab(activeTab === tab.id ? "" : tab.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-5 transition-all hover:bg-slate-50/80 cursor-pointer",
                        activeTab === tab.id ? "bg-blue-50 text-[#0064cb]" : "text-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          activeTab === tab.id ? "bg-blue-100/50" : "bg-slate-100"
                        )}>
                          <tab.icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold tracking-tight uppercase">{tab.label}</span>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        activeTab === tab.id ? "rotate-90 text-[#0064cb]" : "text-slate-300"
                      )} />
                    </button>

                    {activeTab === tab.id && (
                      <div className="p-6 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                        {tab.id === "history" ? (
                          <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            <div className="relative pl-8">
                              <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white bg-[#0064cb] shadow-sm z-10" />
                              <div className="p-4 bg-[#f1f8ff] rounded-xl border border-[#e1f0ff] space-y-2">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-[12px] font-bold text-slate-800">New Project</h4>
                                  <span className="text-[10px] text-slate-400">5/8/2026</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">PERFORMED BY: <span className="text-slate-700 font-bold">System</span></p>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">CUSTOMER: <span className="text-slate-700 font-bold">test B</span></p>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">INVOICE NUMBER: <span className="text-slate-700 font-bold">INV-995462</span></p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : tab.id === "comment" ? (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between pb-2">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">General comments</h3>
                            </div>

                            {/* Comment List */}
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                  <UserPlus className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-slate-800">Gemmo</span>
                                    <span className="text-[11px] text-slate-400">05/08/2026 02:25</span>
                                  </div>
                                  <p className="text-[12px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    Nellie's Verbatim regarding the notification she went outside the geofence: "The system is wrong, I went to check the gate with my flashlight because I heard college kids outside talking loud..."
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                                  <UserPlus className="w-4 h-4" />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-slate-800">Leonard</span>
                                    <span className="text-[11px] text-slate-400">05/07/2026 19:17</span>
                                  </div>
                                  <p className="text-[12px] text-slate-600 leading-relaxed">
                                    Hi Nellie, since you've mentioned that you're having trouble connecting to the internet. I have attached a file, please download it and do your logs on the attached file.
                                  </p>
                                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm group hover:border-[#0064cb] transition-all">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#0064cb] transition-colors">
                                        <FileText className="w-4.5 h-4.5" />
                                      </div>
                                      <span className="text-[11px] font-medium text-slate-600 truncate max-w-[200px]">ckIFGS Firewatch Log_30017100_1778195812.pdf</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#0064cb] transition-all cursor-pointer" title="Download">
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setShowFilePreview(true)}
                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#0064cb] transition-all cursor-pointer"
                                        title="Preview"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Comment Input Area */}
                            <div className="pt-6 flex flex-col md:flex-row gap-3 items-start">
                              {/* Type Selection */}
                              <div className="w-full md:w-28 flex-shrink-0 relative">
                                <span className="absolute -top-2 left-3 px-1.5 bg-white text-[10px] font-bold text-slate-400 uppercase z-10">Type</span>
                                <Select defaultValue="internal">
                                  <SelectTrigger className="!h-14 bg-white border-slate-200 rounded-2xl text-[13px] text-slate-600 focus:ring-[#0064cb]/10 focus:border-[#0064cb] cursor-pointer shadow-sm px-4">
                                    <SelectValue placeholder="Select Type" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="internal" className="text-[13px] cursor-pointer">Internal</SelectItem>
                                    <SelectItem value="external" className="text-[13px] cursor-pointer">External</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Comment Box */}
                              <div className="flex-1 min-w-0 relative">
                                <span className="absolute -top-2 left-4 px-1.5 bg-white text-[10px] font-bold text-slate-400 uppercase z-10">Comment</span>
                                <div className="min-h-[56px] border border-slate-200 rounded-2xl bg-white focus-within:border-[#0064cb] focus-within:ring-4 focus-within:ring-[#0064cb]/5 transition-all p-1.5 pl-3 flex items-center gap-2 shadow-sm overflow-hidden">
                                  <textarea
                                    className="flex-1 bg-transparent border-none focus:outline-none outline-none focus:ring-0 p-2 text-[13px] text-slate-700 placeholder:text-slate-400 resize-none min-h-[40px] max-h-[120px] custom-scrollbar"
                                    placeholder="Write comment..."
                                    rows={1}
                                  />
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button className="p-2 rounded-full hover:bg-slate-50 text-[#0064cb] transition-colors cursor-pointer group" title="Attach file">
                                      <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                    <Button className="bg-[#0064cb] hover:bg-[#0052ae] text-white h-11 px-5 rounded-xl text-[14px] font-bold transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-200/50">
                                      Submit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (tab.id === "dar" || tab.id === "report") ? (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">{tab.label} Documents</h3>
                              <span className="text-[10px] font-bold text-[#0064cb] bg-blue-50 px-2 py-1 rounded-lg">1 File</span>
                            </div>

                            <div className="space-y-3">
                              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm group hover:border-[#0064cb] transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#0064cb] transition-colors">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[12px] font-bold text-slate-700 truncate max-w-[220px]">
                                      {tab.id === "dar" ? "ckIFGS_Firewatch_Log_30017100.pdf" : "Notification_Report_995462.pdf"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium italic">Uploaded 2 hours ago</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-[#0064cb] transition-all cursor-pointer" title="Download">
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setShowFilePreview(true)}
                                    className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-[#0064cb] transition-all cursor-pointer"
                                    title="Preview"
                                  >
                                    <Maximize2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                              <tab.icon className="w-6 h-6 text-slate-200" />
                            </div>
                            <p className="text-xs font-medium text-slate-400 italic">No {tab.label} data available yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Preview Dialog */}
      <Dialog open={showFilePreview} onOpenChange={setShowFilePreview}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 bg-slate-900 border-none rounded-2xl flex flex-col gap-0 overflow-hidden [&>button>svg]:text-white [&>button]:z-50">
          <DialogHeader className="p-4 bg-white/5 border-b border-white/10 flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-sm font-medium flex items-center gap-3">
              <FileText className="w-4 h-4 text-blue-400" />
              ckIFGS Firewatch Log_30017100_1778195812.pdf
            </DialogTitle>
          </DialogHeader>
          <div className="w-full flex-1 overflow-y-auto bg-slate-800 custom-scrollbar p-8 flex items-start justify-center">
            {/* Placeholder for PDF/Image preview */}
            <div className="w-full max-w-2xl aspect-[3/4] bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-[#0064cb]" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">PDF Document Preview</h2>
              <p className="text-slate-500 text-sm max-w-sm">
                This is a high-fidelity preview of the attached Firewatch Log document.
              </p>
              <div className="pt-6 flex gap-3">
                <Button className="bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl">
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NotificationViewPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0064cb]" />
        <p className="text-slate-400 font-medium animate-pulse mt-4">Loading notification details...</p>
      </div>
    }>
      <NotificationViewContent />
    </Suspense>
  );
}
