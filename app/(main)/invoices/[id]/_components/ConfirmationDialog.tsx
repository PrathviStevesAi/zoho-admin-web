"use client";

import { X, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export function ConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false,
  isLoading = false
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">{title}</DialogTitle>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {description}
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl font-bold text-slate-800 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 h-11 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex gap-2 cursor-pointer ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-[#0064cb] hover:bg-[#0052ae] shadow-[#0064cb]/20'}`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
