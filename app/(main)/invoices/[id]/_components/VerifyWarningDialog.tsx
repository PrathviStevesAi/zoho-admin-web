"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface VerifyWarningDialogProps {
  isOpen: boolean;
  warnings: string[];
  onClose: () => void;
  onConfirm: () => void;
}

export function VerifyWarningDialog({
  isOpen,
  warnings,
  onClose,
  onConfirm,
}: VerifyWarningDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 bg-white border-0 shadow-2xl rounded-2xl flex flex-col items-center text-center gap-4">
        <DialogTitle className="sr-only">Warning</DialogTitle>
        <div className="w-16 h-16 rounded-full border-2 border-orange-500 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-orange-500" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Warning</h2>

        <div className="w-full text-left text-sm text-slate-700 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {warnings.length > 0 ? (
            <div className="space-y-2">
              {warnings.map((warning, idx) => (
                <div key={idx} className="leading-relaxed">
                  <div dangerouslySetInnerHTML={{
                    __html: warning
                      .replace(/\n/g, '<br />')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
                      .replace(/Shift \d+/g, '<strong class="text-orange-500">$&</strong>')
                      .replace(/Please confirm first then add\./g, '<div class="text-center font-bold text-slate-900 mt-1 mb-1">Please confirm first then add.</div>')
                  }} />
                </div>
              ))}
            </div>
          ) : (
            <p>There are scheduling conflicts for the selected guards.</p>
          )}
        </div>

        <div className="flex w-full gap-4 mt-2">
          <Button
            variant="outline"
            className="flex-1 h-11 border-blue-600 text-blue-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-bold transition-all"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-lg shadow-orange-500/20 transition-all"
            onClick={onConfirm}
          >
            I know continue assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
