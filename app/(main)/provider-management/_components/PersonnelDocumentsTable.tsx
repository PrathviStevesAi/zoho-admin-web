"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  FileText,
  Search,
  RotateCcw,
  XCircle,
  Eye,
  Trash2,
  Plus,
  UploadCloud,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/table/pagination";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useDebounceValue from "@/hooks/use-debounce";
import {
  clientFetchPersonnelProfileSubdataAction,
  clientGeneratePersonnelMediaUploadUrlAction,
  clientAddPersonnelProfileAttachmentAction,
  clientDeletePersonnelProfileAttachmentAction,
} from "@/lib/client-actions";

export interface PersonnelDocumentItem {
  id?: string;
  attachment_id?: string;
  _id?: string;
  file_id?: string;
  file_name?: string;
  name?: string;
  title?: string;
  url?: string;
  file_url?: string;
  signed_url?: string;
  path?: string;
  file_path?: string;
  media_url?: string;
  uploaded_at?: string;
  upload_at?: string;
  created_at?: string;
  size?: number | string;
  file_size?: number | string;
  document_type?: string;
  type?: string;
  [key: string]: any;
}

interface PersonnelDocumentsTableProps {
  profileId: string;
  entityLabel: string;
  onCountChange?: (count: number) => void;
}

function DocumentFileBadge({ fileName }: { fileName?: string }) {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") {
    return (
      <div className="relative w-8 h-10 shrink-0 select-none">
        <svg viewBox="0 0 32 40" className="w-full h-full drop-shadow-xs" fill="none">
          <path
            d="M2 4C2 2.89543 2.89543 2 4 2H20L30 12V36C30 37.1046 29.1046 38 28 38H4C2.89543 38 2 37.1046 2 36V4Z"
            fill="#EF4444"
          />
          <path
            d="M20 2V10C20 11.1046 20.8954 12 22 12H30L20 2Z"
            fill="#FCA5A5"
          />
          <text
            x="16"
            y="26"
            textAnchor="middle"
            fill="white"
            fontSize="9"
            fontWeight="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            PDF
          </text>
        </svg>
      </div>
    );
  }

  if (["doc", "docx", "txt", "rtf"].includes(ext)) {
    return (
      <div className="relative w-8 h-10 shrink-0 select-none">
        <svg viewBox="0 0 32 40" className="w-full h-full drop-shadow-xs" fill="none">
          <path
            d="M2 4C2 2.89543 2.89543 2 4 2H20L30 12V36C30 37.1046 29.1046 38 28 38H4C2.89543 38 2 37.1046 2 36V4Z"
            fill="#3B82F6"
          />
          <path
            d="M20 2V10C20 11.1046 20.8954 12 22 12H30L20 2Z"
            fill="#93C5FD"
          />
          <line x1="8" y1="20" x2="24" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="25" x2="24" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="30" x2="18" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return (
      <div className="relative w-8 h-10 shrink-0 select-none">
        <svg viewBox="0 0 32 40" className="w-full h-full drop-shadow-xs" fill="none">
          <path
            d="M2 4C2 2.89543 2.89543 2 4 2H20L30 12V36C30 37.1046 29.1046 38 28 38H4C2.89543 38 2 37.1046 2 36V4Z"
            fill="#22C55E"
          />
          <path
            d="M20 2V10C20 11.1046 20.8954 12 22 12H30L20 2Z"
            fill="#86EFAC"
          />
          <circle cx="12" cy="20" r="2" fill="white" />
          <path d="M8 30L14 23L19 28L21 26L24 30H8Z" fill="white" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-8 h-10 shrink-0 select-none">
      <svg viewBox="0 0 32 40" className="w-full h-full drop-shadow-xs" fill="none">
        <path
          d="M2 4C2 2.89543 2.89543 2 4 2H20L30 12V36C30 37.1046 29.1046 38 28 38H4C2.89543 38 2 37.1046 2 36V4Z"
          fill="#64748B"
        />
        <path
          d="M20 2V10C20 11.1046 20.8954 12 22 12H30L20 2Z"
          fill="#CBD5E1"
        />
        <line x1="8" y1="22" x2="24" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="28" x2="20" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function PersonnelDocumentsTable({
  profileId,
  entityLabel,
  onCountChange,
}: PersonnelDocumentsTableProps) {
  const PAGE_SIZE = 15;
  const [documents, setDocuments] = useState<PersonnelDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounceValue(searchQuery, 400);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<PersonnelDocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PersonnelDocumentItem | null>(null);
  const localBlobMap = useRef<Record<string, string>>({});

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await clientFetchPersonnelProfileSubdataAction<PersonnelDocumentItem>(
        profileId,
        "attachments",
        currentPage,
        debouncedSearch,
        PAGE_SIZE
      );

      if (res.success && res.data) {
        setDocuments(res.data);
        const count = typeof res.total === "number" ? res.total : res.data.length;
        setTotalCount(count);
        setPageSize(PAGE_SIZE);
        if (onCountChange && !debouncedSearch) {
          onCountChange(count);
        }
      } else {
        setDocuments([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [profileId, currentPage, debouncedSearch, onCountChange]);

  const displayedDocuments = useMemo(() => {
    if (documents.length > pageSize) {
      const startIndex = (currentPage - 1) * pageSize;
      return documents.slice(startIndex, startIndex + pageSize);
    }
    return documents;
  }, [documents, currentPage, pageSize]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "---";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes?: number | string) => {
    if (!bytes && bytes !== 0) return "";
    const num = Number(bytes);
    if (isNaN(num) || num <= 0) return String(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const generatePayload = {
        file_name: selectedFile.name || "personnel_profile",
        type: "personnel_profile",
        personnel_profile_id: profileId,
      };
      console.log("[PersonnelDocumentsTable] 1. Generate Upload URL Payload:", generatePayload);

      const urlRes = await clientGeneratePersonnelMediaUploadUrlAction(generatePayload);
      console.log("[PersonnelDocumentsTable] 1. Generate Upload URL Response:", urlRes);

      if (!urlRes.success || !urlRes.data?.signed_url) {
        throw new Error(urlRes.error || "Failed to generate upload URL");
      }

      const { signed_url, file_path } = urlRes.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed_url, true);
        if (selectedFile.type) {
          xhr.setRequestHeader("Content-Type", selectedFile.type);
        }
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed (status ${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during file upload"));
        xhr.send(selectedFile);
      });

      const attachmentPayload = {
        personnel_profile_id: profileId,
        url: file_path || "",
        file_name: selectedFile.name,
      };
      console.log("[PersonnelDocumentsTable] 2. Add Attachment Payload:", attachmentPayload);

      const attachRes = await clientAddPersonnelProfileAttachmentAction(attachmentPayload);
      console.log("[PersonnelDocumentsTable] 2. Add Attachment Response:", attachRes);

      if (!attachRes.success) {
        throw new Error(attachRes.error || "Failed to attach document to profile");
      }

      if (selectedFile) {
        try {
          const blobUrl = URL.createObjectURL(selectedFile);
          localBlobMap.current[selectedFile.name] = blobUrl;
          if (file_path) {
            localBlobMap.current[file_path] = blobUrl;
          }
          if (attachRes?.data?.attachment_id || attachRes?.data?.id) {
            const newId = attachRes.data.attachment_id || attachRes.data.id;
            localBlobMap.current[newId] = blobUrl;
          }
        } catch {
        }
      }

      toast.success("Document attached successfully");
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      loadDocuments();
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (doc: PersonnelDocumentItem) => {
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const docId = docToDelete.attachment_id || docToDelete.id || docToDelete._id || docToDelete.file_id;
    if (!docId) {
      toast.error("Document ID not found");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await clientDeletePersonnelProfileAttachmentAction(docId);
      if (res.success) {
        toast.success("Attachment deleted successfully");
        setDeleteDialogOpen(false);
        setDocToDelete(null);
        loadDocuments();
      } else {
        toast.error(res.error || "Failed to delete attachment");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete attachment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDocument = (doc: PersonnelDocumentItem) => {
    setPreviewDoc(doc);
  };

  return (
    <>
      <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white min-h-[480px] flex flex-col !gap-0 !py-0">
        <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0064cb]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-800">
                Documents & Attachments
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {totalCount} Total {totalCount === 1 ? "Document" : "Documents"} Uploaded for this {entityLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="h-9 px-3 text-xs font-semibold rounded-lg text-slate-600 hover:text-red-600 hover:border-red-200 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}

            <Button
              onClick={() => {
                setSelectedFile(null);
                setUploadProgress(0);
                setIsUploading(false);
                setIsUploadDialogOpen(true);
              }}
              className="h-9 px-4 bg-[#0064cb] hover:bg-[#0052ae] text-white font-semibold rounded-md cursor-pointer text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Attachment</span>
            </Button>
          </div>
        </CardHeader>

        <div className="p-4 sm:px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-[340px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search documents by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-9 pr-9 bg-white border-slate-200 rounded-md text-xs font-medium text-slate-800 focus-visible:ring-1 focus-visible:ring-[#0064cb]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            Showing <span className="font-semibold text-slate-700">{displayedDocuments.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalCount}</span> documents
          </div>
        </div>

        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/30">
                  <TableHead className="py-3.5 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    File Name
                  </TableHead>
                  <TableHead className="py-3.5 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Upload At
                  </TableHead>
                  <TableHead className="py-3.5 px-6 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent border-slate-50">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-10 rounded-sm bg-slate-100" />
                          <Skeleton className="h-4 w-48 bg-slate-100" />
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Skeleton className="h-4 w-28 bg-slate-100" />
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                          <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : displayedDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-72 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          {searchQuery ? "No matching documents found" : "No documents available"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {searchQuery
                            ? `We couldn't find any documents matching "${searchQuery}". Try a different term.`
                            : `There are currently no documents or attachments uploaded for this ${entityLabel.toLowerCase()}.`}
                        </p>
                        {searchQuery && (
                          <Button
                            onClick={() => setSearchQuery("")}
                            variant="outline"
                            size="sm"
                            className="mt-2 h-8 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Clear Search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedDocuments.map((doc, idx) => {
                    const fileName = doc.file_name || doc.name || doc.title || `Document-${idx + 1}`;
                    const fileUrl = doc.url || doc.file_url || doc.signed_url || doc.path || doc.file_path || doc.media_url;
                    const dateStr = doc.uploaded_at || doc.upload_at || doc.created_at;

                    return (
                      <TableRow
                        key={doc.id || doc.attachment_id || doc._id || doc.file_id || idx}
                        className="hover:bg-slate-50/60 border-slate-100 transition-colors"
                      >
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <DocumentFileBadge fileName={fileName} />
                            <span className="text-sm font-semibold text-slate-800 truncate max-w-[380px]" title={fileName}>
                              {fileName}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {formatDate(dateStr)}
                        </TableCell>

                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewDocument(doc)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[#0064cb] hover:bg-blue-50 transition-colors cursor-pointer"
                              title="View Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(doc)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalCount > 0 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              limit={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              isPending={isLoading}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          if (!isUploading) {
            setIsUploadDialogOpen(open);
            if (!open) {
              setSelectedFile(null);
              setUploadProgress(0);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 border-slate-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              Upload Attachment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select or drag a file to attach to this {entityLabel.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-[#0064cb] bg-blue-50/50"
                    : "border-slate-200 hover:border-[#0064cb]/60 bg-slate-50/60 hover:bg-blue-50/20"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0064cb] flex items-center justify-center mb-3 shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, DOCX, DOC, PNG, JPG, or XLSX (max 25MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <DocumentFileBadge fileName={selectedFile.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate max-w-[240px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadProgress(0);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">
                        {uploadProgress < 100 ? "Uploading file..." : "Finalizing attachment..."}
                      </span>
                      <span className="text-[#0064cb] font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0064cb] rounded-full transition-all duration-150 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
                setUploadProgress(0);
              }}
              className="h-9 px-4 text-xs font-semibold rounded-md border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
              className="h-9 px-5 bg-[#0064cb] hover:bg-[#0052ae] text-white font-semibold rounded-md cursor-pointer text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDeleteDialogOpen(open);
            if (!open) setDocToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] p-8 rounded-[24px] bg-white border border-slate-100 shadow-2xl">
          <div className="flex flex-col items-start text-left space-y-4">
            <div className="flex items-center justify-start gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2.2} />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 m-0">
                Delete Document?
              </DialogTitle>
            </div>
            <p className="text-[14px] text-slate-600 font-medium leading-relaxed m-0">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-6 w-full">
            <button
              type="button"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDocToDelete(null);
              }}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-full border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-[15px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 py-3 rounded-full bg-[#ff3b3b] hover:bg-[#e03535] text-white font-bold transition-all shadow-[0_4px_14px_0_rgba(255,59,59,0.39)] disabled:opacity-50 cursor-pointer flex justify-center items-center gap-2 text-[15px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                "Yes, delete it"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewDoc}
        onOpenChange={(open) => {
          if (!open) setPreviewDoc(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-2xl overflow-hidden">
          {previewDoc && (() => {
            const fileName =
              previewDoc.file_name ||
              previewDoc.name ||
              previewDoc.title ||
              "Document";
            const dateStr =
              previewDoc.uploaded_at ||
              previewDoc.upload_at ||
              previewDoc.created_at;
            const docId =
              previewDoc.attachment_id ||
              previewDoc.id ||
              previewDoc._id ||
              previewDoc.file_id;
            const rawUrl =
              previewDoc.url ||
              previewDoc.file_url ||
              previewDoc.signed_url ||
              previewDoc.file_path ||
              previewDoc.attachment_url ||
              previewDoc.path ||
              (previewDoc.file_name && localBlobMap.current[previewDoc.file_name]) ||
              (docId && localBlobMap.current[docId]);

            const url = (() => {
              if (!rawUrl || typeof rawUrl !== "string") return null;
              const trimmed = rawUrl.trim();
              if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
              if (
                trimmed.startsWith("http://") ||
                trimmed.startsWith("https://") ||
                trimmed.startsWith("blob:") ||
                trimmed.startsWith("data:")
              ) {
                return trimmed;
              }

              if (localBlobMap.current[trimmed]) {
                return localBlobMap.current[trimmed];
              }
              if (trimmed.startsWith("personnel_profile/") || trimmed.includes("gaurd-traking-media")) {
                const clean = trimmed.replace(/^gaurd-traking-media\//, "");
                return `https://txnlitiwjjbmafpijfgg.supabase.co/storage/v1/object/public/gaurd-traking-media/${clean}`;
              }

              const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
              const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
              return `${apiBase}${cleanPath}`;
            })();

            const ext = fileName.split(".").pop()?.toLowerCase() || "";
            const isImage =
              ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "ico"].includes(ext) ||
              (url ? url.startsWith("data:image") || url.includes(".png") || url.includes(".jpg") || url.includes(".jpeg") || url.includes(".webp") : false);
            const isPdf = ext === "pdf" || (url ? url.includes(".pdf") : false);

            return (
              <>
                <DialogHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <DocumentFileBadge fileName={fileName} />
                    <div className="min-w-0 flex-1">
                      <DialogTitle
                        className="text-base font-bold text-slate-900 truncate"
                        title={fileName}
                      >
                        {fileName}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 mt-0.5">
                        Uploaded on {formatDate(dateStr)}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 my-3 overflow-auto flex items-center justify-center min-h-[300px] bg-slate-50/30 rounded-xl border border-slate-100 overflow-hidden">
                  {url && isImage ? (
                    <img
                      src={url}
                      alt={fileName}
                      className="max-h-[65vh] w-auto max-w-full object-contain"
                    />
                  ) : url && isPdf ? (
                    <iframe
                      src={`${url}#toolbar=0`}
                      title={fileName}
                      className="w-full h-[65vh] border-0 bg-white"
                    />
                  ) : url ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center mb-3 text-[#0064cb]">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 break-all">{fileName}</h4>
                      {docId && (
                        <p className="text-[11px] text-slate-400 font-mono mt-1">ID: {docId}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        Preview is not directly embeddable for this file type.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center mb-3 text-[#0064cb]">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 break-all">
                        {fileName}
                      </h4>
                      {docId && (
                        <p className="text-[11px] text-slate-400 font-mono mt-1">
                          ID: {docId}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        Document uploaded on {formatDate(dateStr)}.
                      </p>
                      <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 mt-3 font-medium">
                        No preview URL available for this existing record (url is null). Newly uploaded documents will display their preview here.
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
                  <span className="text-xs text-slate-400 font-medium">
                    {ext ? `${ext.toUpperCase()} File` : "Document"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewDoc(null)}
                    className="h-9 px-5 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
