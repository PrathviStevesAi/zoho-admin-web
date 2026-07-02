"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Loader2 } from "lucide-react";

interface BadgeViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  badgeUrl: string;
  onDownload: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function BadgeViewDialog({
  isOpen,
  onClose,
  badgeUrl,
  onDownload,
  onDelete,
  isDeleting
}: BadgeViewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white p-6 rounded-lg shadow-xl font-sans flex flex-col items-center border border-slate-100">
        <DialogHeader className="border-b border-slate-100 pb-3 w-full flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-800">Badge ID</DialogTitle>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center justify-center">
          {badgeUrl && (
            <img 
              src={badgeUrl} 
              alt="Guard Badge ID Large View" 
              className="w-64 h-auto rounded border border-slate-200 shadow-md"
            />
          )}
        </div>

        <div className="flex gap-4 w-full border-t border-slate-100 pt-4">
          <Button
            onClick={onDownload}
            className="flex-1 h-11 bg-[#0f766e] hover:bg-[#0d5e58] text-white font-bold rounded flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all border-none"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all border-none"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
