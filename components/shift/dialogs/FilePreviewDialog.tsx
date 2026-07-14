import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { PreviewFile } from "../types";
import { triggerFileDownload } from "../utils";

interface FilePreviewDialogProps {
  previewFile: PreviewFile | null;
  setPreviewFile: (file: PreviewFile | null) => void;
}

export function FilePreviewDialog({ previewFile, setPreviewFile }: FilePreviewDialogProps) {
  return (
    <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
      <DialogContent className="max-w-5xl w-[90vw] h-[85vh] p-0 bg-slate-900 border-none rounded-2xl flex flex-col gap-0 overflow-hidden [&>button>svg]:text-white [&>button]:z-50">
        <DialogHeader className="p-4 bg-white/5 border-b border-white/10 flex flex-row items-center justify-between">
          <DialogTitle className="text-white text-sm font-medium flex items-center gap-3">
            <FileText className="w-4 h-4 text-blue-400" />
            {previewFile?.title || "File Preview"}
          </DialogTitle>
        </DialogHeader>
        <div className="w-full flex-1 bg-slate-800 p-4 md:p-8 flex items-center justify-center overflow-auto">
          {previewFile ? (
            previewFile.contentType?.startsWith("image/") ? (
              (() => {
                const isSignature =
                  previewFile.title?.toLowerCase().includes("sig") ||
                  previewFile.url?.toLowerCase().includes("sig") ||
                  previewFile.title?.toLowerCase().includes("signature") ||
                  previewFile.url?.toLowerCase().includes("signature");
                return (
                  <div className={cn(
                    "relative max-w-full max-h-full flex items-center justify-center rounded-xl",
                    isSignature ? "bg-white p-6 shadow-2xl" : ""
                  )}>
                    <img
                      src={previewFile.url}
                      alt={previewFile.title}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />
                  </div>
                );
              })()
            ) : previewFile.contentType?.startsWith("video/") ? (
              <div className="w-full max-w-2xl aspect-video rounded-lg shadow-2xl overflow-hidden bg-black">
                <video src={previewFile.url} controls className="w-full h-full object-contain" />
              </div>
            ) : previewFile.contentType === "application/pdf" ? (
              <iframe
                src={`${previewFile.url}#toolbar=0`}
                className="w-full h-full rounded-lg shadow-2xl border-none bg-white min-h-[65vh]"
                title={previewFile.title}
              />
            ) : (
              <div className="w-full max-w-2xl aspect-[3/4] bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-[#0064cb]" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{previewFile.title}</h2>
                <p className="text-slate-800 text-sm max-w-sm">
                  Preview not directly supported for this file type ({previewFile.contentType}). Please download to view.
                </p>
                <div className="pt-6 flex gap-3">
                  <button
                    onClick={() => triggerFileDownload(previewFile.url, previewFile.title)}
                    className="bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold shadow-md shadow-blue-200/50 border-none cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              </div>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
