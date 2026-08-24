import React from "react";
import { FileText, Eye, Download, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { ImagePreview } from "./image-preview";
import { toast } from "sonner";

interface GuardDocumentsProps {
  guard: any;
  isEditing: boolean;
  editForm: any;
  handleEditChange: (field: string, value: any, localFile?: File) => void;
  localPreviews: Record<string, string>;
  localFileNames: Record<string, string>;
  deletingDocs: Record<string, boolean>;
  handleDeleteDocument: (documentKey: string, field: string) => void;
}

export function GuardDocuments({
  guard,
  isEditing,
  editForm,
  handleEditChange,
  localPreviews,
  localFileNames,
  deletingDocs,
  handleDeleteDocument
}: GuardDocumentsProps) {

  const getDocumentFilename = (url?: string) => {
    if (!url) return "Document";
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split("/");
      let filename = parts[parts.length - 1];

      if (!filename) return "Document";
      filename = decodeURIComponent(filename);

      const lastDotIndex = filename.lastIndexOf(".");
      if (lastDotIndex !== -1 && lastDotIndex > 0) {
        const name = filename.substring(0, lastDotIndex);
        const ext = filename.substring(lastDotIndex);
        const truncatedName = name.length > 25 ? name.substring(0, 25) + "..." : name;
        return `${truncatedName}${ext}`;
      } else {
        return filename.length > 30 ? filename.substring(0, 30) + "..." : filename;
      }
    } catch (e) {
      const parts = url.split("/");
      let last = parts[parts.length - 1] || "Document";
      last = last.split("?")[0];
      const decoded = decodeURIComponent(last);
      const lastDotIndex = decoded.lastIndexOf(".");
      if (lastDotIndex !== -1 && lastDotIndex > 0) {
        const name = decoded.substring(0, lastDotIndex);
        const ext = decoded.substring(lastDotIndex);
        const truncatedName = name.length > 25 ? name.substring(0, 25) + "..." : name;
        return `${truncatedName}${ext}`;
      }
      return decoded.length > 30 ? decoded.substring(0, 30) + "..." : decoded;
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.loading(`Downloading ${filename}...`, { id: 'downloading' });
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.dismiss('downloading');
      toast.success("Downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.dismiss('downloading');
      toast.error("Failed to download directly. Opening in new tab...");
      window.open(url, "_blank");
    }
  };

  const renderDocumentCard = (
    title: string,
    field: string,
    accept: string,
    documentKey: string,
    previewRenderer: (url: string) => React.ReactNode
  ) => {
    const currentUrl = isEditing ? editForm[field] as string : guard[field] as string;
    const isUploaded = !!currentUrl;
    const previewUrl = localPreviews[field] || currentUrl;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col h-full relative gap-2 min-h-[350px]">
        <div className="flex items-center justify-between gap-2 w-full">
          <h3 className="font-bold text-slate-800 text-[13px] xl:text-[14px] truncate flex-1" title={title}>{title}</h3>
          {isUploaded && (
            <span className="shrink-0 bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border border-green-100">
              Uploaded
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center items-center rounded-md overflow-hidden min-h-[160px] w-full relative">
          {isUploaded ? (
            previewRenderer(previewUrl)
          ) : (
            <div className="text-slate-400 font-medium text-xs flex flex-col items-center gap-2 justify-center w-full h-full border border-dashed border-slate-200 rounded-md bg-slate-50/50 min-h-[160px]">
              <span className="text-xs">No File Uploaded</span>
            </div>
          )}
        </div>

        {isUploaded && !localPreviews[field] && (
          <div className="space-y-1">
            <p className="text-[13px] font-bold text-slate-800 truncate" title={currentUrl}>{getDocumentFilename(currentUrl)}</p>
          </div>
        )}
        {isUploaded && localPreviews[field] && (
          <div className="space-y-1">
            <p className="text-[13px] font-bold text-green-600 truncate" title={localFileNames[field]}>{localFileNames[field]}</p>
          </div>
        )}

        {isEditing && (
          <div className="flex flex-col xl:flex-row items-center gap-3 pt-2 mt-auto w-full">
            <div className="flex-1 w-full">
              <FileUpload
                onFileSelect={(url, localFile) => handleEditChange(field, url, localFile)}
                variant="button"
                buttonText={isUploaded ? "Replace" : "Upload New"}
                buttonClassName="border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold shadow-sm w-full justify-center h-10 px-0 rounded-lg text-[13px]"
                uploadType={documentKey}
                guardEmail={guard.email}
                guardPhone={guard.phone_number}
                accept={accept}
                hideSelectedState={true}
              />
            </div>
            {isUploaded && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteDocument(documentKey, field)}
                disabled={deletingDocs[documentKey]}
                className="flex-1 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold shadow-sm h-10 py-2 sm:py-0 rounded-lg text-[13px]"
              >
                {deletingDocs[documentKey] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />} Delete
              </Button>
            )}
          </div>
        )}

        {!isEditing && isUploaded && (
          <div className="flex items-center gap-3 pt-2 mt-auto w-full">
            <Button variant="outline" size="sm" asChild className="flex-1 border-slate-200 hover:bg-slate-100 font-semibold text-xs cursor-pointer text-[#0064cb] h-10">
              <a href={currentUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5"><Eye className="w-4 h-4" /> Preview</a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(currentUrl, getDocumentFilename(currentUrl))}
              className="flex-1 border-slate-200 hover:bg-slate-100 font-semibold text-xs cursor-pointer text-[#0064cb] h-10 flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 lg:col-span-3">
        <div className="flex items-center gap-2 text-[#0064cb]">
          <FileText className="w-4 h-4" />
          <h3 className="font-bold text-slate-800 text-[14px]">Uploaded Credentials Images</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {renderDocumentCard("Driver License", "driver_license_url", "image/*", "driver-license", (url) => <ImagePreview url={url} alt="Driver License" />)}
          {renderDocumentCard("Security License", "security_guard_license_url", "image/*", "security-guard-license", (url) => <ImagePreview url={url} alt="Security License" />)}
          {renderDocumentCard("Headshot Image", "headshot_image_url", "image/*", "headshot-image", (url) => <ImagePreview url={url} alt="Headshot Image" />)}
          {renderDocumentCard("Firewatch Certificate", "firewatch_certificate_url", "image/*", "firewatch-certificate", (url) => <ImagePreview url={url} alt="Firewatch Certificate" />)}
        </div>
      </div>

      <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderDocumentCard("Verification Video", "verification_video_url", "video/*", "verification-video", (url) => (
          <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-black flex items-center justify-center h-full w-full max-h-[220px]">
            <video src={url} controls className="w-full h-full object-contain" />
          </div>
        ))}
        {renderDocumentCard("Resume Document", "resume_url", ".pdf,.doc,.docx", "resume", (url) => (
          <div className="w-full h-full flex flex-col items-center justify-center p-5 bg-slate-50/70 border border-slate-200 border-dashed gap-3 flex-1 rounded-xl">
            <div className="w-14 h-14 bg-blue-50 text-[#0064cb] rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
              <FileText className="w-7 h-7" />
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider mt-2">PDF Document</span>
          </div>
        ))}
      </div>
    </>
  );
}
