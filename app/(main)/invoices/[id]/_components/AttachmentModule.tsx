import { useState, useEffect, useCallback } from "react";
import { Paperclip, Plus, Eye, Trash2, Loader2, UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateInvoiceUploadUrlAction, uploadInvoiceAttachmentAction, fetchInvoiceAttachmentsAction, deleteInvoiceAttachmentAction } from "@/actions/dashboard.actions";
import { Skeleton } from "@/components/ui/skeleton";

interface AttachmentModuleProps {
  invoiceId: string;
  onCancel: () => void;
}

export function AttachmentModule({ invoiceId, onCancel }: AttachmentModuleProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAttachments = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchInvoiceAttachmentsAction(invoiceId);
    if (res.success && res.data) {
      setAttachments(res.data);
    } else {
      toast.error(res.error || "Failed to load attachments");
    }
    setIsLoading(false);
  }, [invoiceId]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl bg-white mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Paperclip className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Uploaded Attachments</h2>
                <p className="text-slate-500 text-sm">Manage all uploaded files related to calls, reports or shifts.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="px-4 h-10 rounded-lg font-bold shadow-sm transition-all shrink-0 cursor-pointer"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (attachments.length >= 10) {
                    toast.error("Maximum limit reached. You can only upload up to 10 attachments.");
                    return;
                  }
                  setIsUploadOpen(true);
                }}
                disabled={attachments.length >= 10}
                className={`px-4 h-10 rounded-lg font-bold shadow-md transition-all shrink-0 flex items-center justify-center cursor-pointer ${attachments.length >= 10 ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-[#0064cb]/10'}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Attachment
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg w-16">#</th>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Uploaded Date</th>
                  <th className="px-4 py-3 rounded-tr-lg w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(3).fill(0).map((_, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-4" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-12" /></td>
                    </tr>
                  ))
                ) : attachments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No attachments found.
                    </td>
                  </tr>
                ) : (
                  attachments.map((attachment, index) => (
                    <tr key={attachment.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-medium">{index + 1}</td>
                      <td className="px-4 py-3.5 max-w-[200px] truncate" title={attachment.file_name}>
                        {attachment.file_name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{attachment.uploaded_at || "N/A"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-4">
                          <button
                            className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            title="View"
                            onClick={() => window.open(attachment.url, "_blank")}
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            title="Delete"
                            onClick={() => setDeleteAttachmentId(attachment.id)}
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (isUploading || isSubmitting) return;
            setIsUploadOpen(false);
            setSelectedFile(null);
            setUploadedFilePath(null);
            setUploadProgress(0);
          } else {
            setIsUploadOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-visible border-none shadow-2xl rounded-2xl bg-white">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Upload Attachment</DialogTitle>
              <DialogDescription className="text-xs text-slate-800 mt-1">
                Select a file to upload for this invoice.
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-3">
              <Label className="text-md font-bold text-black-900">Select File</Label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-xl ${isUploading ? "bg-slate-100 cursor-not-allowed opacity-70" : "bg-slate-50 hover:bg-slate-100 cursor-pointer"} transition-colors`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className={`w-10 h-10 ${isUploading ? "text-slate-300" : "text-slate-400"} mb-3`} />
                    <p className="mb-2 text-sm text-slate-700">
                      <span className="font-semibold">{isUploading ? "Uploading..." : "Click to upload"}</span> {!isUploading && "or drag and drop"}
                    </p>
                    <p className="text-xs text-slate-500">PDF, JPG, PNG or TXT (MAX. 10MB)</p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    disabled={isUploading}
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setSelectedFile(file);
                        setIsUploading(true);
                        setUploadProgress(1);
                        try {
                          const urlRes = await generateInvoiceUploadUrlAction(invoiceId, file.name, file.type || "application/octet-stream");
                          if (!urlRes.success || !urlRes.data) {
                            throw new Error(urlRes.error || "Failed to generate upload URL");
                          }

                          const { signed_url, file_path } = urlRes.data;

                          await new Promise((resolve, reject) => {
                            let simulatedProgress = 1;
                            setUploadProgress(simulatedProgress);
                            const progressInterval = setInterval(() => {
                              simulatedProgress += Math.floor(Math.random() * 8) + 2;
                              if (simulatedProgress > 90) {
                                simulatedProgress = 90;
                              }
                              setUploadProgress((prev) => Math.max(prev, simulatedProgress));
                            }, 100);

                            const xhr = new XMLHttpRequest();
                            xhr.open("PUT", signed_url, true);
                            xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

                            xhr.upload.onprogress = (event) => {
                              if (event.lengthComputable) {
                                const percentComplete = Math.round((event.loaded / event.total) * 100);
                                setUploadProgress((prev) => Math.max(prev, percentComplete));
                              }
                            };

                            xhr.onload = () => {
                              clearInterval(progressInterval);
                              if (xhr.status >= 200 && xhr.status < 300) {
                                setUploadProgress(100);
                                setTimeout(() => {
                                  setUploadedFilePath(file_path);
                                  toast.success("File uploaded successfully. Click Submit to save.");
                                  resolve(xhr.responseText);
                                }, 300);
                              } else {
                                reject(new Error("Failed to upload file to storage"));
                              }
                            };

                            xhr.onerror = () => {
                              clearInterval(progressInterval);
                              reject(new Error("Network error during upload"));
                            }

                            xhr.send(file);
                          });

                        } catch (error: any) {
                          toast.error(error.message || "An error occurred during upload");
                          setUploadProgress(0);
                          setSelectedFile(null);
                          setUploadedFilePath(null);
                        } finally {
                          setIsUploading(false);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </label>
              </div>
              {selectedFile && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-slate-700 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between w-full overflow-hidden">
                    <span className="truncate max-w-[220px] sm:max-w-[280px] mr-4" title={selectedFile.name}>{selectedFile.name}</span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadedFilePath(null);
                        setUploadProgress(0);
                      }}
                      className="text-red-500 hover:text-red-700 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                      disabled={isUploading || isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {isUploading && !uploadedFilePath && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-[#0064cb] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 pt-0 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsUploadOpen(false);
                setSelectedFile(null);
                setUploadedFilePath(null);
                setUploadProgress(0);
              }}
              disabled={isUploading || isSubmitting}
              className="h-11 px-8 rounded-xl font-bold text-slate-800 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedFile || !uploadedFilePath) return;

                setIsSubmitting(true);
                try {
                  const attachRes = await uploadInvoiceAttachmentAction({
                    invoice_id: invoiceId,
                    attachment_url: uploadedFilePath,
                    file_name: selectedFile.name,
                  });

                  if (!attachRes.success) {
                    throw new Error(attachRes.error || "Failed to link attachment to invoice");
                  }

                  if (attachRes.message && attachRes.message.toLowerCase().includes("already exists")) {
                    toast.error(attachRes.message);
                  } else {
                    toast.success(attachRes.message || "Attachment saved successfully");
                  }

                  setIsUploadOpen(false);
                  setSelectedFile(null);
                  setUploadedFilePath(null);
                  setUploadProgress(0);
                  loadAttachments();
                } catch (error: any) {
                  toast.error(error.message || "An error occurred while saving");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={!uploadedFilePath || isUploading || isSubmitting}
              className={`h-11 px-8 rounded-xl font-bold bg-[#0064cb] hover:bg-[#0052ae] text-white shadow-lg shadow-[#0064cb]/20 transition-all flex gap-2 ${(!uploadedFilePath || isUploading || isSubmitting) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}`}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteAttachmentId} onOpenChange={(open) => !isDeleting && !open && setDeleteAttachmentId(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-visible border-none shadow-2xl rounded-2xl bg-white">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Delete Attachment</DialogTitle>
              <DialogDescription className="text-xs text-slate-800 mt-1">
                Are you sure you want to delete this attachment? This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
          <div className="p-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteAttachmentId(null)}
              disabled={isDeleting}
              className="h-11 px-8 rounded-xl font-bold text-slate-800 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!deleteAttachmentId) return;
                setIsDeleting(true);
                try {
                  const res = await deleteInvoiceAttachmentAction(deleteAttachmentId);
                  if (res.success) {
                    toast.success("Attachment deleted successfully");
                    setDeleteAttachmentId(null);
                    loadAttachments();
                  } else {
                    toast.error(res.error || "Failed to delete attachment");
                  }
                } catch (error: any) {
                  toast.error(error.message || "An error occurred while deleting");
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="h-11 px-8 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all active:scale-95 flex gap-2 cursor-pointer"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
