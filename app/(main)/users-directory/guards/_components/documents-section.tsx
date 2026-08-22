import { Upload, FileText, Image as ImageIcon, Video, CheckCircle2, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import imageCompression from 'browser-image-compression';
import { generateUploadUrlAction } from "@/actions/subcontractor.actions";

export function DocumentsSection({ formData, setFormData }: any) {

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-2">Documents & Uploads</h3>
      <p className="text-xs text-slate-500 mb-6">Upload all required documents (DOC, DOCX, PDF, JPG, PNG, JPEG, HEIC) less than 5MB.</p>

      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <FileUploadItem
          title="Upload Resume"
          icon={<FileText className="w-4 h-4 text-slate-500" />}
          file={formData.resumeFile}
          onFileSelect={(f: any) => setFormData({ ...formData, resumeFile: f })}
          uploadType="resume"
          guardEmail={formData.email}
          guardPhone={formData.phone}
          accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
        />
        <FileUploadItem
          title="Upload Headshot Image"
          icon={<ImageIcon className="w-4 h-4 text-slate-500" />}
          file={formData.headshotFile}
          onFileSelect={(f: any) => setFormData({ ...formData, headshotFile: f })}
          uploadType="headshot-image"
          guardEmail={formData.email}
          guardPhone={formData.phone}
          accept=".png,.jpg,.jpeg,.heic,image/png,image/jpeg,image/heic"
        />
        <FileUploadItem
          title="Upload Guard License"
          icon={<ImageIcon className="w-4 h-4 text-slate-500" />}
          file={formData.securityLicenseFile}
          onFileSelect={(f: any) => setFormData({ ...formData, securityLicenseFile: f })}
          uploadType="security-guard-license-image"
          guardEmail={formData.email}
          guardPhone={formData.phone}
          accept=".png,.jpg,.jpeg,.heic,image/png,image/jpeg,image/heic"
        />
        <FileUploadItem
          title="Upload Driving License"
          icon={<ImageIcon className="w-4 h-4 text-slate-500" />}
          file={formData.driverLicenseFile}
          onFileSelect={(f: any) => setFormData({ ...formData, driverLicenseFile: f })}
          uploadType="driver-license-image"
          guardEmail={formData.email}
          guardPhone={formData.phone}
          accept=".png,.jpg,.jpeg,.heic,image/png,image/jpeg,image/heic"
        />
        <FileUploadItem
          title="Upload Firewatch Certificate"
          icon={<ImageIcon className="w-4 h-4 text-slate-500" />}
          file={formData.firewatchCertFile}
          onFileSelect={(f: any) => setFormData({ ...formData, firewatchCertFile: f })}
          uploadType="firewatch-certificate-image"
          guardEmail={formData.email}
          guardPhone={formData.phone}
          accept=".png,.jpg,.jpeg,.heic,image/png,image/jpeg,image/heic"
        />
        <FileUploadItem
          title="Upload Verification Video"
          icon={<Video className="w-4 h-4 text-slate-500" />}
          file={formData.videoFile}
          onFileSelect={(f: any) => setFormData({ ...formData, videoFile: f })}
          uploadType="verification_video"
          guardEmail={formData.email}
          guardPhone={formData.phone}
          accept=".mp4,.mov,.avi,.webm,video/mp4,video/quicktime,video/x-msvideo,video/webm"
        />
      </div>
    </div>
  );
}

function FileUploadItem({ title, required, icon, file, onFileSelect, note, uploadType, guardEmail, guardPhone, accept }: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localFileName, setLocalFileName] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let selected = e.target.files[0];

      if (accept) {
        const allowedTypes = accept.split(',').map((t: string) => t.trim().toLowerCase());
        const fileExt = '.' + selected.name.split('.').pop()?.toLowerCase();
        const fileType = selected.type.toLowerCase();

        const isValid = allowedTypes.some((type: string) => {
          if (type.startsWith('.')) {
            return type === fileExt;
          }
          if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return fileType.startsWith(baseType + '/');
          }
          return type === fileType;
        });

        if (!isValid) {
          toast.error(`Invalid file format. Allowed formats: ${allowedTypes.filter((t: string) => t.startsWith('.')).join(', ')}`);
          if (inputRef.current) inputRef.current.value = "";
          return;
        }
      }

      setLocalFileName(selected.name);

      if (!guardEmail || !guardPhone) {
        toast.error("Please enter email and phone first before uploading documents.");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      if (selected.type.startsWith("image/")) {
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          selected = await imageCompression(selected, options);
        } catch (error) {
          console.error("Image compression error:", error);
        }
      }

      setIsUploading(true);
      const res = await generateUploadUrlAction(selected.name, uploadType, guardEmail.trim());
      if (!res.success) {
        toast.error(res.error || "Failed to generate upload URL");
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      const signedUrl = res.data.signed_url;
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl, true);
      xhr.setRequestHeader("Content-Type", selected.type || "application/octet-stream");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          onFileSelect(res.data.file_path);
          toast.success(`${selected.name} uploaded successfully!`);
        } else {
          toast.error("Failed to upload file");
          if (inputRef.current) inputRef.current.value = "";
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        toast.error("An error occurred during upload");
        if (inputRef.current) inputRef.current.value = "";
      };

      xhr.send(selected);
    }
  };

  const isUploadedUrl = typeof file === "string" && file.length > 0;

  return (
    <div className="flex items-center justify-between py-2 px-3 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-slate-50/30 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="text-[12px] font-bold text-slate-800">
            {title} {required && <span className="text-red-500">*</span>}
          </span>
          {isUploading && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-blue-100 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-blue-500 h-1 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[9px] font-medium text-blue-700">{uploadProgress}%</span>
            </div>
          )}
          {!isUploading && isUploadedUrl && (
            <div className="flex items-center mt-0.5 pr-2 min-w-0">
              <CheckCircle2 className="w-3 h-3 text-green-600 mr-1 shrink-0" />
              <span className="text-[10px] text-green-600 font-medium truncate block">
                {localFileName || "File uploaded"}
              </span>
            </div>
          )}
          {note && <span className="text-[9px] text-slate-400 mt-0.5">{note}</span>}
        </div>
      </div>

      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
        accept={accept}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="h-8 shrink-0 text-[11px] font-bold text-[#0064cb] border-[#0064cb]/20 hover:bg-[#0064cb]/5 hover:text-[#0064cb] disabled:opacity-50"
      >
        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
        {isUploadedUrl ? "Change" : isUploading ? "Uploading" : "Upload"}
      </Button>
    </div>
  );
}
