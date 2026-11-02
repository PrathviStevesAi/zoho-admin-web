"use client";

import React from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface QrPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null;
  guardName: string;
}

export function QrPreviewDialog({
  isOpen,
  onClose,
  url,
  guardName,
}: QrPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[380px] p-6 text-center bg-white rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-base font-bold text-slate-900">
            Benefit QR Code
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Assigned to {guardName || "Guard"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-xl border border-slate-100 my-4">
          {url ? (
            <img
              src={url}
              alt={`QR code for ${guardName || "Guard"}`}
              className="w-56 max-h-64 object-contain rounded-lg"
            />
          ) : (
            <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <QrCode className="w-12 h-12 text-slate-300" />
              <span>No QR code image found</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-9 px-6 text-xs font-semibold text-slate-700 border-slate-200 cursor-pointer hover:bg-slate-50 rounded-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
