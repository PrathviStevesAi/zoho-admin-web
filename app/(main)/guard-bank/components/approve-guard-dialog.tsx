"use client";

import { useState, useEffect } from "react";
import { Loader2, User, Mail, Phone, BarChart2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GuardInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

interface ApproveGuardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (level: number) => Promise<void>;
  guard: GuardInfo | null;
  isLoading?: boolean;
}

const levels = [
  {
    id: 1,
    title: "Level 1 - Entry Level",
    description: "Meets basic requirements. Suitable for entry-level positions.",
    tag: "Basic",
    tagClass: "bg-green-50 text-green-700",
    shieldColor: "#22c55e",
  },
  {
    id: 2,
    title: "Level 2 - Intermediate",
    description: "Exceeds basic requirements. Professional and reliable.",
    tag: "Professional",
    tagClass: "bg-amber-50 text-amber-700",
    shieldColor: "#f59e0b",
  },
  {
    id: 3,
    title: "Level 3 - Senior Level",
    description: "Exceeds requirements significantly. Seasoned security professional.",
    tag: "Expert",
    tagClass: "bg-purple-50 text-purple-700",
    shieldColor: "#a855f7",
  }
];

export function ApproveGuardDialog({
  isOpen,
  onClose,
  onConfirm,
  guard,
  isLoading = false
}: ApproveGuardDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setSelectedLevel(null), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedLevel !== null) {
      onConfirm(selectedLevel);
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading && !open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 border-none shadow-2xl rounded-2xl bg-white overflow-hidden" hideCloseButton>
        <div className="px-6 pt-6 pb-2 bg-white relative shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-[22px] h-[22px] rounded-full bg-green-50 text-green-500 flex items-center justify-center border border-green-100 shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Approve Guard</DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-slate-500 font-medium ml-[30px] leading-relaxed pr-4">
            Please confirm the approval and assign a level to this guard.
          </DialogDescription>
        </div>

        <div className="px-6 py-4 space-y-6 flex-1 overflow-y-auto">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[#0064cb]">
              <User className="w-[15px] h-[15px] stroke-[2.5]" />
              <h3 className="font-bold text-slate-800 text-[13px]">Guard Information</h3>
            </div>

            <div className="bg-[#f8fafc] border border-slate-200/60 rounded-[14px] p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#0064cb] text-white flex items-center justify-center font-bold text-[17px] shrink-0">
                {guard ? getInitials(guard.first_name, guard.last_name) : "G"}
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="font-bold text-slate-900 text-[14px] truncate tracking-tight">
                  {guard ? `${guard.first_name || ""} ${guard.last_name || ""}`.trim() : "Guard Name"}
                </h4>
                <div className="flex items-center gap-4 text-[12px] text-slate-500 font-medium pt-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{guard?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{guard?.phone_number || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#0064cb]">
                <BarChart2 className="w-[15px] h-[15px] stroke-[2.5]" />
                <h3 className="font-bold text-slate-800 text-[13px]">
                  Select Guard Level <span className="text-red-500">*</span>
                </h3>
              </div>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                Choose the appropriate level based on the guard's qualifications and experience.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {levels.map((level) => (
                <div
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-[14px] border cursor-pointer transition-all bg-white",
                    selectedLevel === level.id
                      ? "border-green-500 shadow-sm ring-1 ring-green-500 bg-green-50/10"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  )}
                >
                  <div className="pt-[5px] shrink-0">
                    <div className={cn(
                      "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors",
                      selectedLevel === level.id
                        ? "border-green-500"
                        : "border-slate-200"
                    )}>
                      {selectedLevel === level.id && (
                        <div className="w-[8px] h-[8px] rounded-full bg-green-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex items-center justify-center w-[25px] h-[20px]">
                          <svg className="absolute w-[25px] h-[25px]" viewBox="0 0 24 24" fill={level.shieldColor} xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          <span className="relative z-10 text-white text-[11px] font-bold leading-none">{level.id}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-[13px] tracking-tight">{level.title}</h4>
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold leading-none", level.tagClass)}>
                        {level.tag}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 font-medium whitespace-pre-line ml-[30px] leading-[1.4]">
                      {level.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-white flex items-center gap-3 rounded-b-2xl shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || selectedLevel === null}
            className="flex-1 h-11 rounded-xl font-bold text-white bg-[#22c55e] hover:bg-[#16a34a] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-sm shadow-green-600/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Confirm & Approve
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
